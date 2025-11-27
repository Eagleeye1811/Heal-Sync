// backend/agents/HospitalAgent.js
const { subscribe, publish } = require('../eventBus');
const EVENTS = require('../constants/events');

class HospitalAgent {
  constructor(id, worldState, log) {
    this.id = id;
    this.worldState = worldState;
    this.log = log;

    // Listen to Lab outbreak events for all diseases
    subscribe('DENGUE_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'dengue'));
    subscribe('MALARIA_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'malaria'));
    subscribe('TYPHOID_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'typhoid'));
    subscribe('INFLUENZA_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'influenza'));
    subscribe('COVID_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'covid'));
  }

  start() {
    // Runs every 8 seconds
    setInterval(() => this.tick(), 8000);
  }

  tick() {
    const h = this.worldState.hospitals[this.id];
    if (!h) return;

    // Calculate total bed usage across all bed types
    const totalBeds = this.getTotalBeds(h);
    const usedBeds = this.getUsedBeds(h);
    
    // Predict future bed needs
    const inflowRate = h.patientMetrics.inflowPerHour;
    const predictedBeds = usedBeds + (0.5 * inflowRate); // Next 30 minutes
    const occupancy = predictedBeds / totalBeds;

    // Check for overload risk
    if (occupancy > 0.85) {
      this.log(
        `[Hospital ${this.id}] Overload risk: predicted ${Math.round(occupancy * 100)}% occupancy (${Math.round(predictedBeds)}/${totalBeds} beds)`,
        { agent: 'Hospital', type: 'OVERLOAD_RISK', hospitalId: this.id, occupancy }
      );

      publish('HOSPITAL_OVERLOAD_RISK', {
        hospitalId: this.id,
        name: h.name,
        occupancy,
        zone: h.zone,
        predictedBeds: Math.round(predictedBeds),
        totalBeds,
        inflowRate
      });
    }

    // Check equipment status
    this.checkEquipmentStatus(h);
    
    // Check ICU capacity specifically
    this.checkICUCapacity(h);
  }

  getTotalBeds(hospital) {
    return Object.values(hospital.beds).reduce((sum, bedType) => sum + bedType.total, 0);
  }

  getUsedBeds(hospital) {
    return Object.values(hospital.beds).reduce((sum, bedType) => sum + bedType.used, 0);
  }

  checkEquipmentStatus(hospital) {
    const ventilators = hospital.equipment.ventilators;
    const ventilatorsAvailable = ventilators.available / ventilators.total;
    
    if (ventilatorsAvailable < 0.2) { // Less than 20% available
      this.log(
        `[Hospital ${this.id}] Critical: Only ${ventilators.available}/${ventilators.total} ventilators available`,
        { agent: 'Hospital', type: 'EQUIPMENT_CRITICAL', hospitalId: this.id, equipment: 'ventilators' }
      );

      publish('EQUIPMENT_SHORTAGE', {
        hospitalId: this.id,
        zone: hospital.zone,
        equipment: 'ventilators',
        available: ventilators.available,
        total: ventilators.total
      });
    }
  }

  checkICUCapacity(hospital) {
    const icu = hospital.beds.icu;
    const icuOccupancy = icu.used / icu.total;
    
    if (icuOccupancy > 0.8) {
      this.log(
        `[Hospital ${this.id}] ICU capacity critical: ${icu.used}/${icu.total} beds occupied (${Math.round(icuOccupancy * 100)}%)`,
        { agent: 'Hospital', type: 'ICU_CRITICAL', hospitalId: this.id }
      );
    }
  }

  onOutbreakAlert(disease, event) {
    const h = this.worldState.hospitals[this.id];
    if (!h) return;

    // Only respond if outbreak is in our zone or adjacent
    if (h.zone !== event.zone) return;

    // Prepare hospital for this disease
    if (h.diseasePrep[disease]) {
      h.diseasePrep[disease].prepared = true;
      h.diseasePrep[disease].staffAlerted = true;
      
      // Prepare isolation ward for infectious diseases
      if (['dengue', 'malaria', 'typhoid', 'covid', 'influenza'].includes(disease)) {
        h.diseasePrep[disease].wardReady = true;
        
        // Reserve isolation beds
        const isolationBeds = h.beds.isolation;
        const bedsToReserve = Math.min(10, isolationBeds.total - isolationBeds.used - isolationBeds.reserved);
        if (bedsToReserve > 0) {
          isolationBeds.reserved += bedsToReserve;
        }
      }

      this.log(
        `[Hospital ${this.id}] Preparing for ${disease} outbreak in ${event.zone}. Ward ready, staff alerted.`,
        { 
          agent: 'Hospital', 
          type: 'OUTBREAK_PREP', 
          hospitalId: this.id, 
          disease,
          riskLevel: event.riskLevel
        }
      );

      // Request medicines from pharmacy
      publish('MEDICINE_REQUEST', {
        hospitalId: this.id,
        zone: h.zone,
        disease,
        urgency: event.riskLevel === 'critical' ? 'high' : 'medium',
        estimatedPatients: event.predictedCases || 50
      });
    }
  }
}

module.exports = HospitalAgent;
