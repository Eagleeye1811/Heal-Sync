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
    // Log initialization
    const p = this.worldState.pharmacies[this.id];
    const medicineCount = Object.keys(p.medicines || {}).length;
    this.log(
      `✅ Pharmacy Agent ${this.id} (${p.name}) initialized - Managing ${medicineCount} medicines in ${p.zone}`,
      { agent: 'Pharmacy', type: 'INIT', entityId: this.id }
    );

    // Runs every 12 seconds
    setInterval(() => this.tick(), 12000);
  }

  tick() {
    const p = this.worldState.pharmacies[this.id];
    if (!p) return;

    // Simulate daily medicine consumption
    this.consumeMedicines(p);

    // Count low stock items
    const lowStockItems = Object.entries(p.medicines).filter(([_, med]) => 
      med.stock <= med.reorderPoint
    ).length;

    // Count pending orders
    const pendingOrders = p.pendingOrders?.length || 0;

    // ALWAYS log current status
    const status = lowStockItems > 0 ? '🟡 MONITORING' : '🟢 NORMAL';
    this.log(
      `${p.name}: ${status} stock levels | ${lowStockItems} items need restock | ${pendingOrders} pending orders`,
      { agent: 'Pharmacy', type: 'STATUS', entityId: this.id, lowStockItems, pendingOrders }
    );

    // Check all medicines for shortage risk
    Object.keys(p.medicines).forEach((medicineName) => {
      this.checkMedicineStock(p, medicineName);
    });
  }

  consumeMedicines(pharmacy) {
    // Simulate medicine usage over time (for demo purposes)
    Object.entries(pharmacy.medicines).forEach(([medName, medicine]) => {
      if (medicine.usagePerDay && medicine.usagePerDay > 0) {
        // Consume a small amount each tick (every 12 seconds = 0.2% of daily usage)
        const consumptionAmount = Math.ceil(medicine.usagePerDay * 0.002);
        if (medicine.stock > 0) {
          medicine.stock = Math.max(0, medicine.stock - consumptionAmount);
        }
      }
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
        `⚠️ ${pharmacy.name}: ${urgency.toUpperCase()} shortage alert for ${medicineName}! Stock: ${stock} units (~${daysLeft.toFixed(1)} days remaining)`,
        { 
          agent: 'Pharmacy', 
          type: 'MED_SHORTAGE', 
          entityId: this.id, 
          medicine: medicineName,
          urgency,
          criticality: medicine.criticality
        }
      );

      // Calculate optimal order quantity
      const orderQuantity = this.calculateOrderQuantity(medicine, daysLeft);

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

        this.log(
          `📤 ${pharmacy.name}: Placing ${urgency} priority order with ${medicine.supplier} - Ordering ${orderQuantity} units of ${medicineName}`,
          { 
            agent: 'Pharmacy', 
            type: 'ORDER_PLACED', 
            entityId: this.id, 
            medicine: medicineName,
            quantity: orderQuantity,
            supplier: medicine.supplier,
            urgency
          }
        );

        // Log coordination message
        this.log(
          `📡 ${pharmacy.name}: Sent order request to ${medicine.supplier} for ${medicineName} (${orderQuantity} units)`,
          { 
            agent: 'Pharmacy', 
            type: 'COORDINATION', 
            entityId: this.id, 
            medicine: medicineName,
            quantity: orderQuantity,
            recipient: medicine.supplier
          }
        );
      }

      publish('MEDICINE_SHORTAGE_RISK', {
        pharmacyId: this.id,
        pharmacyName: pharmacy.name,
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

    this.log(
      `💊 ${p.name}: ${disease.toUpperCase()} OUTBREAK ALERT received from labs! Preparing medicine supplies`,
      { 
        agent: 'Pharmacy', 
        type: 'ALERT_RECEIVED', 
        entityId: this.id,
        disease,
        zone: event.zone
      }
    );

    // Increase usage estimate for relevant medicines
    const medicine = p.medicines[primaryMedicine];
    if (medicine) {
      // Increase daily usage estimate based on risk level
      const multiplier = event.riskLevel === 'critical' ? 2.5 : 
                        event.riskLevel === 'high' ? 2.0 : 1.5;
      
      const oldUsage = medicine.dailyUsage;
      medicine.dailyUsage = Math.round(oldUsage * multiplier);
      const currentStock = medicine.stock;
      const daysRemaining = currentStock / medicine.dailyUsage;

      this.log(
        `📊 ${p.name}: Adjusting ${primaryMedicine} demand forecast - Usage: ${oldUsage} → ${medicine.dailyUsage}/day | Stock: ${currentStock} units (${daysRemaining.toFixed(1)} days supply)`,
        { 
          agent: 'Pharmacy', 
          type: 'DEMAND_FORECAST', 
          entityId: this.id,
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
      `📩 ${p.name}: Medicine request received from ${event.hospitalName || 'Hospital'} for ${event.disease} outbreak (${event.urgency} priority)`,
      { agent: 'Pharmacy', type: 'REQUEST_RECEIVED', entityId: this.id, hospitalId: event.hospitalId, urgency: event.urgency }
    );

    // Proactively check stock for outbreak-related medicines
    const disease = event.disease;
    const primaryMedicine = this.getPrimaryMedicineForDisease(disease);
    
    if (primaryMedicine && p.medicines[primaryMedicine]) {
      const medicine = p.medicines[primaryMedicine];
      const stockStatus = medicine.stock > medicine.reorderPoint ? 'sufficient' : 'low';
      
      this.log(
        `📦 ${p.name}: Checking ${primaryMedicine} inventory - Stock: ${medicine.stock} units (Status: ${stockStatus})`,
        { agent: 'Pharmacy', type: 'STOCK_CHECK', entityId: this.id, medicine: primaryMedicine, stock: medicine.stock }
      );
      
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
