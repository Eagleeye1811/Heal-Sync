// backend/agents/initAgents.js
const LabAgent = require('./LabAgent');
const HospitalAgent = require('./HospitalAgent');
const PharmacyAgent = require('./PharmacyAgent');
const SupplierAgent = require('./SupplierAgent');
const CityAgent = require('./CityAgent');
const EVENTS = require('../constants/events');

// publish(EVENTS.DENGUE_OUTBREAK_PREDICTED, {...})
// subscribe(EVENTS.MEDICINE_SHORTAGE_RISK, handler)


let logFn = console.log;

function setLogSender(fn) {
  logFn = fn;
}

function initAgents(worldState) {
  const agents = [];

  agents.push(new LabAgent('L1', worldState, logFn));
  agents.push(new HospitalAgent('H1', worldState, logFn));
  agents.push(new HospitalAgent('H2', worldState, logFn));
  agents.push(new PharmacyAgent('P1', worldState, logFn));
  agents.push(new SupplierAgent('S1', worldState, logFn));
  agents.push(new CityAgent(worldState, logFn));

  agents.forEach((a) => a.start());
}

module.exports = { initAgents, setLogSender };
