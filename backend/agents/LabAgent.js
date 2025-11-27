// backend/agents/LabAgent.js
const { publish } = require("../eventBus");
const EVENTS = require('../constants/events');

// publish(EVENTS.DENGUE_OUTBREAK_PREDICTED, {...})
// subscribe(EVENTS.MEDICINE_SHORTAGE_RISK, handler)


class LabAgent {
  constructor(id, worldState, log) {
    this.id = id;
    this.worldState = worldState;
    this.log = log;
  }

  start() {
    // Runs every 10 seconds
    setInterval(() => this.tick(), 10000);
  }

  tick() {
    const lab = this.worldState.labs[this.id];
    if (!lab) return;

    const history = lab.dengueTestsHistory;
    const today = lab.dengueTestsToday;

    if (!history || history.length < 2) return;

    const last = history[history.length - 1];
    const secondLast = history[history.length - 2];
    const avg = (last + secondLast) / 2;

    if (avg > 0 && today > 1.5 * avg) {
      this.log(
        `[Lab ${this.id}] Dengue spike in ${
          lab.zone
        }: today=${today}, avg=${avg.toFixed(1)}`,
        { agent: "Lab", type: "DENGUE_ALERT", zone: lab.zone }
      );

      publish("DENGUE_OUTBREAK_PREDICTED", {
        zone: lab.zone,
        today,
        avg,
      });
    }
  }
}

module.exports = LabAgent;
