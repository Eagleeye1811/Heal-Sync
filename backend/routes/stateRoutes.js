// backend/routes/stateRoutes.js
const express = require('express');
const { publish } = require('../eventBus');

module.exports = (worldState, getLogs, log) => {
  const router = express.Router();

  // Return full current state (for frontend dashboard)
  router.get('/state', (req, res) => {
    res.json(worldState);
  });

  // Return recent logs (using getLogs from logger)
  router.get('/logs', (req, res) => {
    const logs = getLogs();
    res.json(logs.slice(0, 50));
  });

  // === SCENARIO TRIGGERS ===

  // Scenario 1: Dengue Outbreak
  router.post('/simulate/dengue', (req, res) => {
    // City Agent announces scenario trigger
    if (log) {
      log(
        '🚨 SCENARIO TRIGGERED: Dengue Outbreak - Activating emergency response protocol across all zones',
        { agent: 'City', type: 'SCENARIO_TRIGGER', entityId: 'CITY', scenario: 'dengue' }
      );
    }

    // Increase dengue tests in both labs
    Object.keys(worldState.labs).forEach(labId => {
      const lab = worldState.labs[labId];
      if (lab.testData && lab.testData.dengue) {
        const previousToday = lab.testData.dengue.today;
        lab.testData.dengue.today += 25;
        lab.testData.dengue.positive += 15;
        lab.testData.dengue.negative += 10;
        
        // Update history
        if (!lab.testData.dengue.history) lab.testData.dengue.history = [];
        lab.testData.dengue.history.push(lab.testData.dengue.today);
        lab.testData.dengue.history = lab.testData.dengue.history.slice(-14);

        // Log the spike
        if (log) {
          log(
            `⚠️ ${lab.name}: DENGUE SPIKE DETECTED! Tests jumped from ${previousToday} to ${lab.testData.dengue.today} (+${25} tests, ${15} positive)`,
            { agent: 'Lab', type: 'OUTBREAK_DETECTED', entityId: labId, disease: 'dengue' }
          );
        }

        // Trigger immediate outbreak detection
        publish('DENGUE_OUTBREAK_PREDICTED', {
          labId,
          zone: lab.zone,
          disease: 'dengue',
          today: lab.testData.dengue.today,
          positive: lab.testData.dengue.positive,
          previousToday,
          growthRate: ((25 / Math.max(previousToday, 1)) * 100).toFixed(1),
          riskLevel: 'critical',
          confidence: 0.95
        });
      }
    });

    // Increase city dengue cases
    if (worldState.city && worldState.city.diseaseStats && worldState.city.diseaseStats.dengue) {
      worldState.city.diseaseStats.dengue.newToday += 15;
      worldState.city.diseaseStats.dengue.activeCases += 15;
    }

    res.json({ ok: true, message: 'Dengue outbreak simulated - Labs showing increased positive tests' });
  });

  // Scenario 2: Malaria Outbreak
  router.post('/simulate/malaria', (req, res) => {
    if (log) {
      log(
        '🚨 SCENARIO TRIGGERED: Malaria Outbreak - Activating emergency response protocol',
        { agent: 'City', type: 'SCENARIO_TRIGGER', entityId: 'CITY', scenario: 'malaria' }
      );
    }

    Object.keys(worldState.labs).forEach(labId => {
      const lab = worldState.labs[labId];
      if (lab.testData && lab.testData.malaria) {
        const previousToday = lab.testData.malaria.today;
        lab.testData.malaria.today += 20;
        lab.testData.malaria.positive += 12;
        lab.testData.malaria.negative += 8;
        if (!lab.testData.malaria.history) lab.testData.malaria.history = [];
        lab.testData.malaria.history.push(lab.testData.malaria.today);
        lab.testData.malaria.history = lab.testData.malaria.history.slice(-14);

        if (log) {
          log(
            `⚠️ ${lab.name}: MALARIA SPIKE DETECTED! Tests: ${previousToday} → ${lab.testData.malaria.today} (+${12} positive)`,
            { agent: 'Lab', type: 'OUTBREAK_DETECTED', entityId: labId, disease: 'malaria' }
          );
        }

        publish('MALARIA_OUTBREAK_PREDICTED', {
          labId,
          zone: lab.zone,
          disease: 'malaria',
          today: lab.testData.malaria.today,
          positive: lab.testData.malaria.positive,
          riskLevel: 'high',
          confidence: 0.90
        });
      }
    });

    if (worldState.city && worldState.city.diseaseStats && worldState.city.diseaseStats.malaria) {
      worldState.city.diseaseStats.malaria.newToday += 12;
      worldState.city.diseaseStats.malaria.activeCases += 12;
    }

    res.json({ ok: true, message: 'Malaria outbreak simulated' });
  });

  // Scenario 3: Heatwave
  router.post('/simulate/heatwave', (req, res) => {
    // Update environment data
    if (worldState.environment) {
      Object.keys(worldState.environment.weather).forEach(zone => {
        worldState.environment.weather[zone].temperature = 42;
        worldState.environment.weather[zone].condition = 'Extreme Heat';
      });
      worldState.environment.heatwaveAlert = true;
    }

    // Increase hospital admissions for heat-related cases
    Object.keys(worldState.hospitals).forEach(hId => {
      const h = worldState.hospitals[hId];
      if (h.patientMetrics) {
        h.patientMetrics.admissionsToday += 15;
        h.patientMetrics.criticalCases += 3;
      }
      // Occupy more beds
      if (h.beds && h.beds.general) {
        h.beds.general.occupied = Math.min(h.beds.general.total, h.beds.general.occupied + 10);
      }
    });

    res.json({ ok: true, message: 'Heatwave simulated - Increased hospital admissions' });
  });

  // Scenario 4: Hospital Overload (Zone-2)
  router.post('/simulate/hospital-overload', (req, res) => {
    // Find hospitals in Zone-2 and max out their capacity
    Object.entries(worldState.hospitals).forEach(([hId, h]) => {
      if (h.zone === 'Zone-2') {
        Object.keys(h.beds).forEach(bedType => {
          h.beds[bedType].occupied = Math.floor(h.beds[bedType].total * 0.95); // 95% occupancy
        });
        if (h.patientMetrics) {
          h.patientMetrics.erWaitingTime = 120; // 2 hours
          h.patientMetrics.criticalCases += 5;
        }
      }
    });

    res.json({ ok: true, message: 'Hospital overload simulated in Zone-2' });
  });

  // Scenario 5: Medicine Shortage
  router.post('/simulate/medicine-shortage', (req, res) => {
    // Deplete specific medicines in pharmacies
    Object.keys(worldState.pharmacies).forEach(pId => {
      const p = worldState.pharmacies[pId];
      if (p.medicines) {
        // Reduce antivirals and antibiotics
        Object.entries(p.medicines).forEach(([medId, med]) => {
          if (med.category === 'Antivirals' || med.category === 'Antibiotics') {
            med.stock = Math.floor(med.stock * 0.3); // Drop to 30%
          }
        });
      }
    });

    res.json({ ok: true, message: 'Medicine shortage simulated - Antivirals and antibiotics depleted' });
  });

  // Scenario 6: COVID Surge
  router.post('/simulate/covid', (req, res) => {
    if (log) {
      log(
        '🚨 SCENARIO TRIGGERED: COVID Surge - Activating ICU and isolation protocols',
        { agent: 'City', type: 'SCENARIO_TRIGGER', entityId: 'CITY', scenario: 'covid' }
      );
    }

    Object.keys(worldState.labs).forEach(labId => {
      const lab = worldState.labs[labId];
      if (lab.testData && lab.testData.covid) {
        const previousToday = lab.testData.covid.today;
        lab.testData.covid.today += 30;
        lab.testData.covid.positive += 18;
        lab.testData.covid.negative += 12;
        if (!lab.testData.covid.history) lab.testData.covid.history = [];
        lab.testData.covid.history.push(lab.testData.covid.today);
        lab.testData.covid.history = lab.testData.covid.history.slice(-14);

        if (log) {
          log(
            `⚠️ ${lab.name}: COVID SURGE DETECTED! Tests: ${previousToday} → ${lab.testData.covid.today} (+${18} positive cases)`,
            { agent: 'Lab', type: 'OUTBREAK_DETECTED', entityId: labId, disease: 'covid' }
          );
        }

        publish('COVID_OUTBREAK_PREDICTED', {
          labId,
          zone: lab.zone,
          disease: 'covid',
          today: lab.testData.covid.today,
          positive: lab.testData.covid.positive,
          riskLevel: 'critical',
          confidence: 0.95
        });
      }
    });

    if (worldState.city && worldState.city.diseaseStats && worldState.city.diseaseStats.covid) {
      worldState.city.diseaseStats.covid.newToday += 18;
      worldState.city.diseaseStats.covid.activeCases += 18;
    }

    // Increase ICU and isolation bed usage
    Object.keys(worldState.hospitals).forEach(hId => {
      const h = worldState.hospitals[hId];
      if (h.beds) {
        if (h.beds.icu) {
          const icuBefore = h.beds.icu.occupied;
          h.beds.icu.occupied = Math.min(h.beds.icu.total, h.beds.icu.occupied + 3);
          if (log && h.beds.icu.occupied > icuBefore) {
            log(
              `🏥 ${h.name}: Preparing ICU beds for COVID patients - ICU occupancy now ${h.beds.icu.occupied}/${h.beds.icu.total}`,
              { agent: 'Hospital', type: 'BED_ALLOCATION', entityId: hId }
            );
          }
        }
        if (h.beds.isolation) {
          const isolationBefore = h.beds.isolation.occupied;
          h.beds.isolation.occupied = Math.min(h.beds.isolation.total, h.beds.isolation.occupied + 8);
          if (log && h.beds.isolation.occupied > isolationBefore) {
            log(
              `🏥 ${h.name}: Activating isolation wards - Isolation beds now ${h.beds.isolation.occupied}/${h.beds.isolation.total}`,
              { agent: 'Hospital', type: 'BED_ALLOCATION', entityId: hId }
            );
          }
        }
      }
    });

    res.json({ ok: true, message: 'COVID surge simulated - ICU and isolation beds filling up' });
  });

  // Scenario 7: Reset to Normal
  router.post('/simulate/reset', (req, res) => {
    // Reset environment
    if (worldState.environment) {
      Object.keys(worldState.environment.weather).forEach(zone => {
        worldState.environment.weather[zone].temperature = 32;
        worldState.environment.weather[zone].condition = 'Partly Cloudy';
      });
      worldState.environment.heatwaveAlert = false;
    }

    // This is a simplified reset - in production, you'd reload from a saved initial state
    res.json({ ok: true, message: 'System reset to baseline (partial - restart server for full reset)' });
  });

  return router;
};
