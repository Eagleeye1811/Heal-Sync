// backend/agents/PharmacyAgent.js
const { subscribe, publish } = require('../eventBus');
const EVENTS = require('../constants/events');

// publish(EVENTS.DENGUE_OUTBREAK_PREDICTED, {...})
// subscribe(EVENTS.MEDICINE_SHORTAGE_RISK, handler)


class PharmacyAgent {
  constructor(id, worldState, log) {
    this.id = id;
    this.worldState = worldState;
    this.log = log;

    subscribe('DENGUE_OUTBREAK_PREDICTED', this.onDengueAlert.bind(this));
  }

  start() {
    // Runs every 12 seconds
    setInterval(() => this.tick(), 12000);
  }

  tick() {
    const p = this.worldState.pharmacies[this.id];
    if (!p) return;

    Object.keys(p.stock).forEach((item) => {
      const stock = p.stock[item];
      const usage = p.dailyUsageEstimate[item] || 1;
      const daysLeft = stock / usage;

      if (daysLeft < 2) {
        this.log(
          `[Pharmacy ${this.id}] Shortage risk for ${item}: ${stock} left (~${daysLeft.toFixed(1)} days)`,
          { agent: 'Pharmacy', type: 'MED_SHORTAGE', pharmacyId: this.id, item }
        );

        publish('MEDICINE_SHORTAGE_RISK', {
          pharmacyId: this.id,
          item,
          stock,
          zone: p.zone,
        });
      }
    });
  }

  onDengueAlert(event) {
    const p = this.worldState.pharmacies[this.id];
    if (!p) return;

    if (p.zone === event.zone) {
      p.dailyUsageEstimate.dengueMed =
        (p.dailyUsageEstimate.dengueMed || 5) * 1.5;

      this.log(
        `[Pharmacy ${this.id}] Increasing dengue medicine usage estimate for ${event.zone}`,
        { agent: 'Pharmacy', type: 'DENGUE_PREP', pharmacyId: this.id }
      );
    }
  }
}

module.exports = PharmacyAgent;
