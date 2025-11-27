// backend/agents/HospitalAgent.js
const { subscribe, publish } = require('../eventBus');
const EVENTS = require('../constants/events');

// publish(EVENTS.DENGUE_OUTBREAK_PREDICTED, {...})
// subscribe(EVENTS.MEDICINE_SHORTAGE_RISK, handler)


class HospitalAgent {
  constructor(id, worldState, log) {
    this.id = id;
    this.worldState = worldState;
    this.log = log;

    // Listen to LabAgent outbreak events
    subscribe('DENGUE_OUTBREAK_PREDICTED', this.onDengueAlert.bind(this));
  }

  start() {
    // Runs every 8 seconds
    setInterval(() => this.tick(), 8000);
  }

  tick() {
    const h = this.worldState.hospitals[this.id];
    if (!h) return;

    const predictedBeds = h.bedsUsed + 0.5 * h.patientInflowPerHour;
    const occupancy = predictedBeds / h.bedsTotal;

    if (occupancy > 0.85) {
      this.log(
        `[Hospital ${this.id}] Overload risk: predicted ${Math.round(occupancy * 100)}% beds used`,
        { agent: 'Hospital', type: 'OVERLOAD_RISK', hospitalId: this.id }
      );

      publish('HOSPITAL_OVERLOAD_RISK', {
        hospitalId: this.id,
        occupancy,
        zone: h.zone,
      });
    }
  }

  onDengueAlert(event) {
    const h = this.worldState.hospitals[this.id];
    if (!h) return;

    if (h.zone === event.zone) {
      h.preparedForDengue = true;
      this.log(
        `[Hospital ${this.id}] Preparing dengue ward for ${event.zone}`,
        { agent: 'Hospital', type: 'DENGUE_PREP', hospitalId: this.id }
      );
    }
  }
}

module.exports = HospitalAgent;
