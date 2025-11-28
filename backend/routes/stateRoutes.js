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

  // Scenario 1: Dengue Outbreak (PROGRESSIVE)
  router.post('/simulate/dengue', (req, res) => {
    // City Agent announces scenario trigger
    if (log) {
      log(
        '🚨 SCENARIO TRIGGERED: Dengue Outbreak - Gradual spread initiating across zones',
        { agent: 'City', type: 'SCENARIO_TRIGGER', entityId: 'CITY', scenario: 'dengue' }
      );
    }

    // PROGRESSIVE OUTBREAK: Spread gradually over 2 minutes
    let tick = 0;
    const maxTicks = 12; // 2 minutes (every 10 seconds)
    
    const outbreakInterval = setInterval(() => {
      Object.keys(worldState.labs).forEach(labId => {
        const lab = worldState.labs[labId];
        if (lab.testData && lab.testData.dengue) {
          // Exponential growth: increases more each tick
          const growth = Math.floor(2 + (tick * 1.5)); // 2, 3, 5, 6, 8...
          const previousToday = lab.testData.dengue.today;
          
          lab.testData.dengue.today += growth;
          lab.testData.dengue.positive += Math.floor(growth * 0.6); // 60% positive rate
          lab.testData.dengue.negative += Math.ceil(growth * 0.4);
          
          // Update history every 3 ticks
          if (tick % 3 === 0) {
            if (!lab.testData.dengue.history) lab.testData.dengue.history = [];
            lab.testData.dengue.history.push(lab.testData.dengue.today);
            lab.testData.dengue.history = lab.testData.dengue.history.slice(-14);
          }

          // Log the growth
          if (log && tick % 2 === 0) { // Log every other tick
            log(
              `📈 ${lab.name}: Dengue tests rising - now at ${lab.testData.dengue.today} tests (+${growth} new, ${Math.floor(growth * 0.6)} positive)`,
              { agent: 'Lab', type: 'OUTBREAK_PROGRESS', entityId: labId, disease: 'dengue', tick }
            );
          }

          // Trigger outbreak alert after reaching threshold (tick 5)
          if (tick === 5) {
            publish('DENGUE_OUTBREAK_PREDICTED', {
              labId,
              zone: lab.zone,
              disease: 'dengue',
              today: lab.testData.dengue.today,
              positive: lab.testData.dengue.positive,
              previousToday,
              growthRate: ((lab.testData.dengue.today - previousToday) / Math.max(previousToday, 1) * 100).toFixed(1),
              riskLevel: 'critical',
              confidence: 0.95
            });
          }
        }
      });

      // Increase city dengue cases
      if (worldState.city && worldState.city.diseaseStats && worldState.city.diseaseStats.dengue) {
        const caseIncrease = Math.floor(1 + tick * 1.2);
        worldState.city.diseaseStats.dengue.newToday += caseIncrease;
        worldState.city.diseaseStats.dengue.activeCases += caseIncrease;
      }

      tick++;
      if (tick >= maxTicks) {
        clearInterval(outbreakInterval);
        if (log) {
          log(
            '🔴 DENGUE OUTBREAK: Peak reached - hospitals and pharmacies coordinating response',
            { agent: 'City', type: 'OUTBREAK_PEAK', entityId: 'CITY', scenario: 'dengue' }
          );
        }
      }
    }, 10000); // Every 10 seconds

    res.json({ ok: true, message: 'Dengue outbreak initiated - watch it spread progressively over 2 minutes!' });
  });

  // Scenario 2: Malaria Outbreak (PROGRESSIVE)
  router.post('/simulate/malaria', (req, res) => {
    if (log) {
      log(
        '🚨 SCENARIO TRIGGERED: Malaria Outbreak - Gradual spread pattern detected',
        { agent: 'City', type: 'SCENARIO_TRIGGER', entityId: 'CITY', scenario: 'malaria' }
      );
    }

    // PROGRESSIVE OUTBREAK: Spread over 1.5 minutes
    let tick = 0;
    const maxTicks = 9;
    
    const outbreakInterval = setInterval(() => {
      Object.keys(worldState.labs).forEach(labId => {
        const lab = worldState.labs[labId];
        if (lab.testData && lab.testData.malaria) {
          const growth = Math.floor(2 + (tick * 1.2));
          const previousToday = lab.testData.malaria.today;
          
          lab.testData.malaria.today += growth;
          lab.testData.malaria.positive += Math.floor(growth * 0.5);
          lab.testData.malaria.negative += Math.ceil(growth * 0.5);
          
          if (tick % 3 === 0) {
            if (!lab.testData.malaria.history) lab.testData.malaria.history = [];
            lab.testData.malaria.history.push(lab.testData.malaria.today);
            lab.testData.malaria.history = lab.testData.malaria.history.slice(-14);
          }

          if (log && tick % 2 === 0) {
            log(
              `📈 ${lab.name}: Malaria cases climbing - ${lab.testData.malaria.today} tests (+${growth} new)`,
              { agent: 'Lab', type: 'OUTBREAK_PROGRESS', entityId: labId, disease: 'malaria', tick }
            );
          }

          if (tick === 4) {
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
        }
      });

      if (worldState.city && worldState.city.diseaseStats && worldState.city.diseaseStats.malaria) {
        const caseIncrease = Math.floor(1 + tick);
        worldState.city.diseaseStats.malaria.newToday += caseIncrease;
        worldState.city.diseaseStats.malaria.activeCases += caseIncrease;
      }

      tick++;
      if (tick >= maxTicks) clearInterval(outbreakInterval);
    }, 10000);

    res.json({ ok: true, message: 'Malaria outbreak initiated - progressive spread over 1.5 minutes' });
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
        h.beds.general.used = Math.min(h.beds.general.total, h.beds.general.used + 10);
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
          h.beds[bedType].used = Math.floor(h.beds[bedType].total * 0.95); // 95% occupancy
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

  // Scenario 6: COVID Surge (PROGRESSIVE)
  router.post('/simulate/covid', (req, res) => {
    if (log) {
      log(
        '🚨 SCENARIO TRIGGERED: COVID Surge - Progressive wave pattern detected, ICU protocols activating',
        { agent: 'City', type: 'SCENARIO_TRIGGER', entityId: 'CITY', scenario: 'covid' }
      );
    }

    // PROGRESSIVE OUTBREAK: COVID spreads over 2.5 minutes
    let tick = 0;
    const maxTicks = 15;
    
    const outbreakInterval = setInterval(() => {
      Object.keys(worldState.labs).forEach(labId => {
        const lab = worldState.labs[labId];
        if (lab.testData && lab.testData.covid) {
          const growth = Math.floor(2 + (tick * 1.8)); // Faster growth
          const previousToday = lab.testData.covid.today;
          
          lab.testData.covid.today += growth;
          lab.testData.covid.positive += Math.floor(growth * 0.65); // 65% positive
          lab.testData.covid.negative += Math.ceil(growth * 0.35);
          
          if (tick % 3 === 0) {
            if (!lab.testData.covid.history) lab.testData.covid.history = [];
            lab.testData.covid.history.push(lab.testData.covid.today);
            lab.testData.covid.history = lab.testData.covid.history.slice(-14);
          }

          if (log && tick % 2 === 0) {
            log(
              `📈 ${lab.name}: COVID surge intensifying - ${lab.testData.covid.today} tests (+${growth} new, ${Math.floor(growth * 0.65)} positive)`,
              { agent: 'Lab', type: 'OUTBREAK_PROGRESS', entityId: labId, disease: 'covid', tick }
            );
          }

          if (tick === 6) {
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
        }
      });

      if (worldState.city && worldState.city.diseaseStats && worldState.city.diseaseStats.covid) {
        const caseIncrease = Math.floor(1 + tick * 1.3);
        worldState.city.diseaseStats.covid.newToday += caseIncrease;
        worldState.city.diseaseStats.covid.activeCases += caseIncrease;
      }

      // Gradually fill ICU and isolation beds
      if (tick % 3 === 0) {
        Object.keys(worldState.hospitals).forEach(hId => {
          const h = worldState.hospitals[hId];
          if (h.beds) {
            if (h.beds.icu && h.beds.icu.used < h.beds.icu.total) {
              const icuBefore = h.beds.icu.used;
              h.beds.icu.used = Math.min(h.beds.icu.total, h.beds.icu.used + 1);
              if (log && h.beds.icu.used > icuBefore) {
                log(
                  `🏥 ${h.name}: ICU filling - now ${h.beds.icu.used}/${h.beds.icu.total} occupied`,
                  { agent: 'Hospital', type: 'BED_ALLOCATION', entityId: hId }
                );
              }
            }
            if (h.beds.isolation && h.beds.isolation.used < h.beds.isolation.total) {
              const isolationBefore = h.beds.isolation.used;
              h.beds.isolation.used = Math.min(h.beds.isolation.total, h.beds.isolation.used + 2);
              if (log && h.beds.isolation.used > isolationBefore && tick % 6 === 0) {
                log(
                  `🏥 ${h.name}: Isolation ward expanding - ${h.beds.isolation.used}/${h.beds.isolation.total} beds`,
                  { agent: 'Hospital', type: 'BED_ALLOCATION', entityId: hId }
                );
              }
            }
          }
        });
      }

      tick++;
      if (tick >= maxTicks) {
        clearInterval(outbreakInterval);
        if (log) {
          log(
            '🔴 COVID SURGE: Peak wave reached - all healthcare facilities in coordinated response mode',
            { agent: 'City', type: 'OUTBREAK_PEAK', entityId: 'CITY', scenario: 'covid' }
          );
        }
      }
    }, 10000);

    res.json({ ok: true, message: 'COVID surge initiated - progressive spread over 2.5 minutes with ICU impact' });
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
