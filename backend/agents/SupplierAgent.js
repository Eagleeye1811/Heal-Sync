// backend/agents/SupplierAgent.js
const { subscribe } = require('../eventBus');
const EVENTS = require('../constants/events');

// publish(EVENTS.DENGUE_OUTBREAK_PREDICTED, {...})
// subscribe(EVENTS.MEDICINE_SHORTAGE_RISK, handler)


class SupplierAgent {
  constructor(id, worldState, log) {
    this.id = id;
    this.worldState = worldState;
    this.log = log;

    subscribe('MEDICINE_SHORTAGE_RISK', this.onMedicineShortage.bind(this));
    subscribe('HOSPITAL_OVERLOAD_RISK', this.onHospitalOverload.bind(this));
  }

  start() {
    // SupplierAgent is mostly event-driven; no frequent tick needed
    // But we can still have a periodic health check if we want
    // setInterval(() => this.tick(), 30000);
  }

  onMedicineShortage(event) {
    const s = this.worldState.suppliers[this.id];
    if (!s) return;

    const { item, zone, pharmacyId, stock } = event;

    const available = s.inventory[item] || 0;
    if (available <= 0) {
      this.log(
        `[Supplier ${this.id}] Cannot supply ${item} to Pharmacy ${pharmacyId} in ${zone} (no stock left)`,
        { agent: 'Supplier', type: 'NO_SUPPLY', pharmacyId, item, zone }
      );
      return;
    }

    // Decide quantity to send (simple rule: min(available, stock * 2) or 100)
    const quantity = Math.min(available, Math.max(stock * 2, 50));

    s.inventory[item] -= quantity;

    this.log(
      `[Supplier ${this.id}] Supplying ${quantity} of ${item} to Pharmacy ${pharmacyId} in ${zone}. Remaining in warehouse: ${s.inventory[item]}`,
      { agent: 'Supplier', type: 'SUPPLY_SENT', pharmacyId, item, quantity, zone }
    );
  }

  onHospitalOverload(event) {
    const s = this.worldState.suppliers[this.id];
    if (!s) return;

    const { hospitalId, occupancy, zone } = event;

    // For now, just log. If we want, we can send ventilators or equipment.
    this.log(
      `[Supplier ${this.id}] Noted overload risk at Hospital ${hospitalId} in ${zone} (occupancy=${Math.round(occupancy * 100)}%). Ready to prioritize equipment supply.`,
      { agent: 'Supplier', type: 'OVERLOAD_NOTICE', hospitalId, zone }
    );
  }
}

module.exports = SupplierAgent;
