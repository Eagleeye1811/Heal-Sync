// backend/agents/PharmacyAgent.js
const { subscribe, publish } = require('../eventBus');
const EVENTS = require('../constants/events');

class PharmacyAgent {
  constructor(id, worldState, log) {
    this.id = id;
    this.worldState = worldState;
    this.log = log;

    // Subscribe to outbreak alerts for all diseases
    subscribe('DENGUE_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'dengue', 'dengueMed'));
    subscribe('MALARIA_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'malaria', 'chloroquine'));
    subscribe('TYPHOID_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'typhoid', 'ceftriaxone'));
    subscribe('INFLUENZA_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'influenza', 'oseltamivir'));
    subscribe('COVID_OUTBREAK_PREDICTED', this.onOutbreakAlert.bind(this, 'covid', 'oseltamivir'));
    
    // Subscribe to medicine requests from hospitals
    subscribe('MEDICINE_REQUEST', this.onMedicineRequest.bind(this));
  }

  start() {
    // Runs every 12 seconds
    setInterval(() => this.tick(), 12000);
  }

  tick() {
    const p = this.worldState.pharmacies[this.id];
    if (!p) return;

    // Check all medicines for shortage risk
    Object.keys(p.medicines).forEach((medicineName) => {
      this.checkMedicineStock(p, medicineName);
    });
  }

  checkMedicineStock(pharmacy, medicineName) {
    const medicine = pharmacy.medicines[medicineName];
    if (!medicine) return;

    const stock = medicine.stock;
    const dailyUsage = medicine.dailyUsage;
    const reorderPoint = medicine.reorderPoint;
    const daysLeft = dailyUsage > 0 ? stock / dailyUsage : 999;

    // Check if we're at or below reorder point
    if (stock <= reorderPoint) {
      const urgency = daysLeft < 2 ? 'high' : daysLeft < 5 ? 'medium' : 'low';
      
      this.log(
        `[Pharmacy ${this.id}] ${urgency.toUpperCase()} shortage risk for ${medicineName}: ${stock} units left (~${daysLeft.toFixed(1)} days)`,
        { 
          agent: 'Pharmacy', 
          type: 'MED_SHORTAGE', 
          pharmacyId: this.id, 
          medicine: medicineName,
          urgency,
          criticality: medicine.criticality
        }
      );

      // Calculate optimal order quantity
      const orderQuantity = this.calculateOrderQuantity(medicine, daysLeft);

      publish('MEDICINE_SHORTAGE_RISK', {
        pharmacyId: this.id,
        medicine: medicineName,
        stock,
        daysLeft: daysLeft.toFixed(1),
        reorderPoint,
        urgency,
        criticality: medicine.criticality,
        zone: pharmacy.zone,
        orderQuantity,
        supplier: medicine.supplier
      });

      // Add to pending orders
      if (!pharmacy.pendingOrders.some(o => o.medicine === medicineName)) {
        pharmacy.pendingOrders.push({
          medicine: medicineName,
          quantity: orderQuantity,
          supplier: medicine.supplier,
          urgency,
          timestamp: new Date().toISOString(),
          status: 'requested'
        });
      }
    }
  }

  calculateOrderQuantity(medicine, daysLeft) {
    // Order enough for 7-14 days depending on criticality
    const targetDays = medicine.criticality === 'high' ? 14 : 10;
    const optimalStock = medicine.dailyUsage * targetDays;
    const orderQuantity = Math.max(optimalStock - medicine.stock, medicine.dailyUsage * 7);
    
    // Round up to nearest 10 for easier handling
    return Math.ceil(orderQuantity / 10) * 10;
  }

  onOutbreakAlert(disease, primaryMedicine, event) {
    const p = this.worldState.pharmacies[this.id];
    if (!p) return;

    // Only respond if outbreak is in our zone
    if (p.zone !== event.zone) return;

    // Increase usage estimate for relevant medicines
    const medicine = p.medicines[primaryMedicine];
    if (medicine) {
      // Increase daily usage estimate based on risk level
      const multiplier = event.riskLevel === 'critical' ? 2.5 : 
                        event.riskLevel === 'high' ? 2.0 : 1.5;
      
      const oldUsage = medicine.dailyUsage;
      medicine.dailyUsage = Math.round(oldUsage * multiplier);

      this.log(
        `[Pharmacy ${this.id}] ${disease.toUpperCase()} outbreak alert - Increasing ${primaryMedicine} usage estimate from ${oldUsage} to ${medicine.dailyUsage} per day`,
        { 
          agent: 'Pharmacy', 
          type: 'OUTBREAK_PREP', 
          pharmacyId: this.id,
          disease,
          medicine: primaryMedicine,
          multiplier
        }
      );

      // Immediately check if we need to order more
      setTimeout(() => this.checkMedicineStock(p, primaryMedicine), 1000);
    }

    // Also increase related medicines
    const relatedMedicines = this.getRelatedMedicines(disease);
    relatedMedicines.forEach(medName => {
      if (p.medicines[medName]) {
        const oldUsage = p.medicines[medName].dailyUsage;
        p.medicines[medName].dailyUsage = Math.round(oldUsage * 1.3);
      }
    });
  }

  getRelatedMedicines(disease) {
    const relatedMap = {
      dengue: ['paracetamol', 'ivFluids', 'ors'],
      malaria: ['artemether', 'paracetamol'],
      typhoid: ['azithromycin', 'ciprofloxacin', 'ivFluids'],
      influenza: ['paracetamol', 'ibuprofen', 'fluVaccine'],
      covid: ['azithromycin', 'paracetamol', 'covidVaccine']
    };
    return relatedMap[disease] || [];
  }

  onMedicineRequest(event) {
    const p = this.worldState.pharmacies[this.id];
    if (!p) return;

    // Check if request is for our zone
    if (p.zone !== event.zone) return;

    this.log(
      `[Pharmacy ${this.id}] Received medicine request from Hospital ${event.hospitalId} for ${event.disease} outbreak`,
      { agent: 'Pharmacy', type: 'REQUEST_RECEIVED', pharmacyId: this.id, hospitalId: event.hospitalId }
    );

    // Proactively check stock for outbreak-related medicines
    const disease = event.disease;
    const primaryMedicine = this.getPrimaryMedicineForDisease(disease);
    
    if (primaryMedicine && p.medicines[primaryMedicine]) {
      this.checkMedicineStock(p, primaryMedicine);
    }
  }

  getPrimaryMedicineForDisease(disease) {
    const diseaseMap = {
      dengue: 'dengueMed',
      malaria: 'chloroquine',
      typhoid: 'ceftriaxone',
      influenza: 'oseltamivir',
      covid: 'oseltamivir'
    };
    return diseaseMap[disease];
  }
}

module.exports = PharmacyAgent;
