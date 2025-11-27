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
    // Log initialization
    const h = this.worldState.hospitals[this.id];
    this.log(
      `✅ Hospital Agent ${this.id} (${h.name}) initialized - Monitoring ${this.getTotalBeds(h)} beds in ${h.zone}`,
      { agent: 'Hospital', type: 'INIT', entityId: this.id }
    );

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
    const occupancyPercent = Math.round(occupancy * 100);

    // ALWAYS log current status (not just problems)
    const status = occupancy > 0.85 ? '🔴 HIGH' : occupancy > 0.7 ? '🟡 MODERATE' : '🟢 NORMAL';
    this.log(
      `${h.name}: ${status} occupancy ${occupancyPercent}% (${usedBeds}/${totalBeds} beds) | ICU: ${h.beds.icu.used}/${h.beds.icu.total} | ER Wait: ${h.patientMetrics.erWaitingTime}min`,
      { agent: 'Hospital', type: 'STATUS', entityId: this.id, occupancy: occupancyPercent }
    );

    // Check for overload risk
    if (occupancy > 0.85) {
      this.log(
        `⚠️ ${h.name}: CAPACITY ALERT! Predicted ${occupancyPercent}% occupancy - Preparing for overflow`,
        { agent: 'Hospital', type: 'OVERLOAD_RISK', entityId: this.id, occupancy }
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

    this.log(
      `🏥 ${h.name}: OUTBREAK ALERT RECEIVED for ${disease.toUpperCase()} in ${event.zone}! Activating emergency response`,
      { 
        agent: 'Hospital', 
        type: 'ALERT_RECEIVED', 
        entityId: this.id, 
        disease,
        zone: event.zone
      }
    );

    // Prepare hospital for this disease
    if (h.diseasePrep[disease]) {
      h.diseasePrep[disease].prepared = true;
      h.diseasePrep[disease].staffAlerted = true;
      
      // Prepare isolation ward for infectious diseases
      if (['dengue', 'malaria', 'typhoid', 'covid', 'influenza'].includes(disease)) {
        h.diseasePrep[disease].wardReady = true;
        
        // Reserve isolation beds AND actually occupy some to simulate preparation
        const isolationBeds = h.beds.isolation;
        const bedsToReserve = Math.min(10, isolationBeds.total - isolationBeds.occupied);
        if (bedsToReserve > 0) {
          // Actually occupy beds to prepare the ward
          isolationBeds.occupied = Math.min(isolationBeds.total, isolationBeds.occupied + Math.floor(bedsToReserve / 2));
          
          this.log(
            `🛏️ ${h.name}: Preparing isolation ward for ${disease} - Occupancy increased to ${isolationBeds.occupied}/${isolationBeds.total} beds`,
            { 
              agent: 'Hospital', 
              type: 'BED_ALLOCATION', 
              entityId: this.id, 
              disease,
              bedsOccupied: isolationBeds.occupied
            }
          );
        }
        
        // Also prepare general beds
        const generalBeds = h.beds.general;
        const generalToPrep = Math.min(5, generalBeds.total - generalBeds.occupied);
        if (generalToPrep > 0) {
          generalBeds.occupied = Math.min(generalBeds.total, generalBeds.occupied + generalToPrep);
        }
      }

      this.log(
        `✅ ${h.name}: ${disease.toUpperCase()} ward prepared - Staff alerted, beds reserved, requesting medicine supplies`,
        { 
          agent: 'Hospital', 
          type: 'OUTBREAK_PREP', 
          entityId: this.id, 
          disease,
          riskLevel: event.riskLevel
        }
      );

      // Get pharmacies in this zone
      const zonePharmacies = Object.entries(this.worldState.pharmacies)
        .filter(([_, p]) => p.zone === h.zone)
        .map(([id, p]) => p.name || id);

      // Request medicines from pharmacy
      publish('MEDICINE_REQUEST', {
        hospitalId: this.id,
        hospitalName: h.name,
        zone: h.zone,
        disease,
        urgency: event.riskLevel === 'critical' ? 'high' : 'medium',
        estimatedPatients: event.predictedCases || 50
      });

      // Log coordination message
      this.log(
        `📡 ${h.name}: Sending ${disease} medicine request to ${zonePharmacies.length} pharmacies in ${h.zone} (${zonePharmacies.join(', ')})`,
        { 
          agent: 'Hospital', 
          type: 'COORDINATION', 
          entityId: this.id, 
          disease,
          recipients: zonePharmacies
        }
      );
    }
  }
}

module.exports = HospitalAgent;
