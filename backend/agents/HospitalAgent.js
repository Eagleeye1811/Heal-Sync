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

    // DYNAMIC SIMULATION: Simulate patient flow naturally
    this.simulatePatientFlow(h);
    
    // DYNAMIC SIMULATION: Simulate equipment usage and degradation
    this.simulateEquipmentUsage(h);

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

  simulatePatientFlow(hospital) {
    // Simulate realistic patient arrivals and discharges
    const baseArrivalRate = hospital.patientMetrics.inflowPerHour;
    
    // Random variation: 60-140% of base rate
    const randomFactor = 0.6 + (Math.random() * 0.8);
    const tickDuration = 8; // seconds
    const arrivalsThisTick = Math.floor((baseArrivalRate / 450) * tickDuration * randomFactor);
    
    // Patient arrivals: Distribute across bed types with realistic probabilities
    if (arrivalsThisTick > 0) {
      const probabilities = {
        general: 0.5,    // 50% general ward
        icu: 0.1,        // 10% ICU
        isolation: 0.15, // 15% isolation
        pediatric: 0.15, // 15% pediatric
        maternity: 0.1   // 10% maternity
      };
      
      for (let i = 0; i < arrivalsThisTick; i++) {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [bedType, prob] of Object.entries(probabilities)) {
          cumulative += prob;
          if (rand <= cumulative && hospital.beds[bedType]) {
            if (hospital.beds[bedType].used < hospital.beds[bedType].total) {
              hospital.beds[bedType].used++;
              hospital.patientMetrics.admissionsToday++;
              break;
            }
          }
        }
      }
    }
    
    // Patient discharges: 3-5% chance per tick for each bed type
    const dischargeRate = 0.03 + (Math.random() * 0.02); // 3-5%
    
    Object.keys(hospital.beds).forEach(bedType => {
      const beds = hospital.beds[bedType];
      if (beds.used > 0) {
        const discharges = Math.floor(beds.used * dischargeRate);
        if (discharges > 0) {
          beds.used = Math.max(0, beds.used - discharges);
        }
      }
    });
    
    // Update ER wait time based on occupancy
    const totalBeds = this.getTotalBeds(hospital);
    const usedBeds = this.getUsedBeds(hospital);
    const occupancy = usedBeds / totalBeds;
    
    // Wait time increases with occupancy
    const baseWait = 10; // minutes
    hospital.patientMetrics.erWaitingTime = Math.floor(baseWait + (occupancy * 50));
  }

  simulateEquipmentUsage(hospital) {
    // Simulate equipment degradation and usage
    const equipment = hospital.equipment;
    
    // Ventilators: Small chance of needing maintenance
    if (Math.random() < 0.01 && equipment.ventilators.available > 0) {
      equipment.ventilators.available--;
      equipment.ventilators.maintenance++;
      this.log(
        `🔧 ${hospital.name}: Ventilator requires maintenance - Available: ${equipment.ventilators.available}/${equipment.ventilators.total}`,
        { agent: 'Hospital', type: 'EQUIPMENT_MAINTENANCE', entityId: this.id, equipment: 'ventilator' }
      );
    }
    
    // Occasionally fix equipment in maintenance (5% chance)
    if (Math.random() < 0.05 && equipment.ventilators.maintenance > 0) {
      equipment.ventilators.maintenance--;
      equipment.ventilators.available++;
    }
    
    // Oxygen cylinders: Consumption and replenishment
    const oxygenConsumption = Math.floor(Math.random() * 3); // 0-2 cylinders per tick
    if (equipment.oxygenCylinders.available > oxygenConsumption) {
      equipment.oxygenCylinders.available -= oxygenConsumption;
      equipment.oxygenCylinders.inUse += oxygenConsumption;
    }
    
    // Refill oxygen (10% chance to replenish some)
    if (Math.random() < 0.1) {
      const refillAmount = Math.min(5, equipment.oxygenCylinders.empty);
      equipment.oxygenCylinders.available += refillAmount;
      equipment.oxygenCylinders.empty = Math.max(0, equipment.oxygenCylinders.empty - refillAmount);
    }
    
    // Some cylinders become empty (from inUse)
    if (equipment.oxygenCylinders.inUse > 0 && Math.random() < 0.15) {
      const emptyAmount = Math.min(2, equipment.oxygenCylinders.inUse);
      equipment.oxygenCylinders.inUse -= emptyAmount;
      equipment.oxygenCylinders.empty += emptyAmount;
    }
    
    // Ambulances: Dynamic availability
    if (Math.random() < 0.1 && equipment.ambulances.available > 0) {
      // Ambulance dispatched
      equipment.ambulances.available--;
      equipment.ambulances.onRoute++;
    }
    
    if (Math.random() < 0.15 && equipment.ambulances.onRoute > 0) {
      // Ambulance returns
      equipment.ambulances.onRoute--;
      equipment.ambulances.available++;
    }
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
        const bedsToReserve = Math.min(10, isolationBeds.total - isolationBeds.used);
        if (bedsToReserve > 0) {
          // Actually occupy beds to prepare the ward
          isolationBeds.used = Math.min(isolationBeds.total, isolationBeds.used + Math.floor(bedsToReserve / 2));
          
          this.log(
            `🛏️ ${h.name}: Preparing isolation ward for ${disease} - Occupancy increased to ${isolationBeds.used}/${isolationBeds.total} beds`,
            { 
              agent: 'Hospital', 
              type: 'BED_ALLOCATION', 
              entityId: this.id, 
              disease,
              bedsOccupied: isolationBeds.used
            }
          );
        }
        
        // Also prepare general beds
        const generalBeds = h.beds.general;
        const generalToPrep = Math.min(5, generalBeds.total - generalBeds.used);
        if (generalToPrep > 0) {
          generalBeds.used = Math.min(generalBeds.total, generalBeds.used + generalToPrep);
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
