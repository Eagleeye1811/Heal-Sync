// backend/agents/CityAgent.js
const { subscribe } = require('../eventBus');
const EVENTS = require('../constants/events');

// publish(EVENTS.DENGUE_OUTBREAK_PREDICTED, {...})
// subscribe(EVENTS.MEDICINE_SHORTAGE_RISK, handler)


class CityAgent {
  constructor(worldState, log) {
    this.worldState = worldState;
    this.log = log;

    subscribe('DENGUE_OUTBREAK_PREDICTED', this.onDengueOutbreak.bind(this));
    subscribe('HOSPITAL_OVERLOAD_RISK', this.onHospitalOverload.bind(this));
    subscribe('MEDICINE_SHORTAGE_RISK', this.onMedicineShortage.bind(this));
  }

  start() {
    // Periodic city health summary
    setInterval(() => this.tick(), 20000); // every 20s
  }

  tick() {
    const city = this.worldState.city;
    const riskZones = city.riskZones;

    const highRiskZones = Object.entries(riskZones)
      .filter(([_, risks]) => risks.dengue === 'high' || risks.heatwave === 'high')
      .map(([zone]) => zone);

    if (highRiskZones.length > 0) {
      this.log(
        `[CityAgent] Current high-risk zones: ${highRiskZones.join(', ')}`,
        { agent: 'City', type: 'CITY_SUMMARY', highRiskZones }
      );
    } else {
      this.log(
        `[CityAgent] City status: no zones currently marked high risk.`,
        { agent: 'City', type: 'CITY_SUMMARY', highRiskZones: [] }
      );
    }
  }

  onDengueOutbreak(event) {
    const { zone, today, avg } = event;
    const city = this.worldState.city;

    if (!city.riskZones[zone]) {
      city.riskZones[zone] = { dengue: 'low', heatwave: 'low' };
    }

    city.riskZones[zone].dengue = 'high';

    city.activeAlerts.push({
      type: 'DENGUE',
      zone,
      message: `Dengue outbreak predicted in ${zone} (today=${today}, avg=${avg.toFixed(1)})`,
      timestamp: new Date().toISOString(),
    });

    this.log(
      `[CityAgent] Marked ${zone} as HIGH dengue risk (today=${today}, avg=${avg.toFixed(1)})`,
      { agent: 'City', type: 'DENGUE_RISK_HIGH', zone }
    );
  }

  onHospitalOverload(event) {
    const { hospitalId, occupancy, zone } = event;
    const city = this.worldState.city;

    city.activeAlerts.push({
      type: 'HOSPITAL_OVERLOAD',
      zone,
      message: `Hospital ${hospitalId} overload risk (${Math.round(occupancy * 100)}% predicted)`,
      timestamp: new Date().toISOString(),
    });

    this.log(
      `[CityAgent] Recorded overload risk for Hospital ${hospitalId} in ${zone}.`,
      { agent: 'City', type: 'OVERLOAD_ALERT', hospitalId, zone }
    );
  }

  onMedicineShortage(event) {
    const { pharmacyId, item, zone, stock } = event;
    const city = this.worldState.city;

    city.activeAlerts.push({
      type: 'MEDICINE_SHORTAGE',
      zone,
      message: `Medicine shortage risk: ${item} at Pharmacy ${pharmacyId} in ${zone} (stock=${stock})`,
      timestamp: new Date().toISOString(),
    });

    this.log(
      `[CityAgent] Medicine shortage risk for ${item} at Pharmacy ${pharmacyId} in ${zone}.`,
      { agent: 'City', type: 'MED_SHORTAGE_ALERT', pharmacyId, item, zone }
    );
  }
}

module.exports = CityAgent;
