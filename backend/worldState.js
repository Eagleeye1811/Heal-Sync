// backend/worldState.js
const worldState = {
  hospitals: {
    H1: {
      name: "City Central Hospital",
      zone: "Zone-1",
      bedsTotal: 100,
      bedsUsed: 60,
      icuBedsTotal: 20,
      icuBedsUsed: 10,
      ventilatorsTotal: 15,
      ventilatorsUsed: 5,
      patientInflowPerHour: 8,
      preparedForDengue: false,
      preparedForHeatwave: false,
    },
    H2: {
      name: "Sunrise Hospital",
      zone: "Zone-2",
      bedsTotal: 80,
      bedsUsed: 40,
      icuBedsTotal: 10,
      icuBedsUsed: 6,
      ventilatorsTotal: 10,
      ventilatorsUsed: 4,
      patientInflowPerHour: 5,
      preparedForDengue: false,
      preparedForHeatwave: false,
    },
  },

  labs: {
    L1: {
      name: "Metro Diagnostics",
      zone: "Zone-2",
      dengueTestsToday: 30,
      dengueTestsHistory: [10, 14, 18], // simple recent pattern
    },
  },

  pharmacies: {
    P1: {
      name: "HealthPlus Pharmacy",
      zone: "Zone-2",
      stock: {
        paracetamol: 500,
        ors: 150,
        antiviral: 80,
        dengueMed: 50,
      },
      dailyUsageEstimate: {
        paracetamol: 50,
        ors: 20,
        antiviral: 8,
        dengueMed: 5,
      },
    },
  },

  // You can later add suppliers here
  suppliers: {
    S1: {
      name: "MediSupply Co.",
      zone: "Central",
      inventory: {
        paracetamol: 10000,
        ors: 2000,
        antiviral: 1000,
        dengueMed: 500,
        ventilators: 50,
      },
    },
  },

  city: {
    activeAlerts: [],
    riskZones: {
      "Zone-1": { dengue: "low", heatwave: "medium" },
      "Zone-2": { dengue: "medium", heatwave: "low" },
    },
  },
};

module.exports = worldState;
