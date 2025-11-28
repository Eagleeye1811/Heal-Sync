// backend/agents/LabAgent.js
const { publish } = require("../eventBus");
const EVENTS = require('../constants/events');

class LabAgent {
  constructor(id, worldState, log) {
    this.id = id;
    this.worldState = worldState;
    this.log = log;
  }

  start() {
    // Log initialization
    const lab = this.worldState.labs[this.id];
    this.log(
      `✅ Lab Agent ${this.id} (${lab.name}) initialized - Testing 5 diseases in ${lab.zone}`,
      { agent: 'Lab', type: 'INIT', entityId: this.id }
    );

    // Runs every 10 seconds
    setInterval(() => this.tick(), 10000);
  }

  tick() {
    const lab = this.worldState.labs[this.id];
    if (!lab) return;

    // DYNAMIC SIMULATION: Simulate natural test growth and disease patterns
    const diseases = ['dengue', 'malaria', 'typhoid', 'influenza', 'covid'];
    this.simulateNaturalTestGrowth(lab, diseases);

    // Calculate total tests and positive rates
    const totalTests = Object.values(lab.testData).reduce((sum, data) => sum + (data.today || 0), 0);
    const totalPositive = Object.values(lab.testData).reduce((sum, data) => sum + (data.positive || 0), 0);
    const positiveRate = totalTests > 0 ? ((totalPositive / totalTests) * 100).toFixed(1) : 0;

    // Find diseases with concerning positive rates
    const concerning = diseases.filter(d => {
      const data = lab.testData[d];
      return data && data.today > 0 && (data.positive / data.today) > 0.1; // >10% positive
    });

    // ALWAYS log current status
    const concerningText = concerning.length > 0 ? ` | 🔍 Monitoring: ${concerning.join(', ')}` : '';
    this.log(
      `${lab.name}: Processing ${totalTests} tests today | Positive rate: ${positiveRate}%${concerningText}`,
      { agent: 'Lab', type: 'STATUS', entityId: this.id, totalTests, positiveRate }
    );
    
    // Check all diseases for outbreaks
    diseases.forEach(disease => {
      this.checkDiseaseOutbreak(lab, disease);
    });
    
    // Check lab capacity
    this.checkLabCapacity(lab);
  }

  simulateNaturalTestGrowth(lab, diseases) {
    // Simulate realistic disease test patterns with natural variation
    diseases.forEach(disease => {
      const testData = lab.testData[disease];
      if (!testData) return;
      
      // Get seasonal factor for this disease
      const seasonalFactor = this.getSeasonalFactor(disease);
      
      // Base variation: -3 to +8 tests per tick with seasonal influence
      const baseChange = Math.floor((Math.random() * 11 - 3) * seasonalFactor);
      
      // Apply change
      const previousValue = testData.today;
      testData.today = Math.max(0, testData.today + baseChange);
      
      // Update history if significant change (every 6 ticks = ~1 minute)
      if (!testData.tickCount) testData.tickCount = 0;
      testData.tickCount++;
      
      if (testData.tickCount >= 6) {
        testData.tickCount = 0;
        // Add to history (keep last 7 entries)
        if (!testData.history) testData.history = [];
        testData.history.push(previousValue);
        if (testData.history.length > 7) {
          testData.history.shift();
        }
      }
      
      // Update positive cases (realistic 8-25% positive rate with variation)
      const basePositiveRate = 0.08 + (Math.random() * 0.17); // 8-25%
      testData.positive = Math.floor(testData.today * basePositiveRate);
      testData.positiveRate = testData.today > 0 ? 
        ((testData.positive / testData.today) * 100).toFixed(1) : 0;
      
      // Randomly trigger mini-spikes (5% chance per tick)
      if (Math.random() < 0.05) {
        const spike = Math.floor(Math.random() * 8 + 3); // 3-10 test spike
        testData.today += spike;
        testData.positive = Math.floor(testData.today * (basePositiveRate * 1.3)); // Higher positive rate during spike
      }
    });
  }

  getSeasonalFactor(disease) {
    // Simulate realistic seasonal patterns for diseases
    const month = new Date().getMonth(); // 0-11
    const hour = new Date().getHours(); // 0-23
    
    // Seasonal patterns
    let seasonalMultiplier = 1.0;
    
    switch(disease) {
      case 'dengue':
        // Peak during monsoon (June-September) - months 5-8
        if ([5, 6, 7, 8].includes(month)) {
          seasonalMultiplier = 1.6;
        } else if ([4, 9].includes(month)) {
          seasonalMultiplier = 1.3;
        }
        break;
        
      case 'malaria':
        // Peak post-monsoon (July-October) - months 6-9
        if ([6, 7, 8, 9].includes(month)) {
          seasonalMultiplier = 1.5;
        }
        break;
        
      case 'influenza':
        // Peak in winter (November-February) - months 10,11,0,1
        if ([10, 11, 0, 1].includes(month)) {
          seasonalMultiplier = 1.7;
        }
        break;
        
      case 'covid':
        // Slight increase in winter - months 11,0,1
        if ([11, 0, 1].includes(month)) {
          seasonalMultiplier = 1.3;
        }
        break;
        
      case 'typhoid':
        // Peak in summer (April-June) - months 3-5
        if ([3, 4, 5].includes(month)) {
          seasonalMultiplier = 1.4;
        }
        break;
    }
    
    // Time-of-day factor: More tests in morning hours (8am-12pm)
    if (hour >= 8 && hour <= 12) {
      seasonalMultiplier *= 1.2;
    } else if (hour >= 13 && hour <= 16) {
      seasonalMultiplier *= 1.1;
    }
    
    return seasonalMultiplier;
  }

  checkDiseaseOutbreak(lab, disease) {
    const testData = lab.testData[disease];
    if (!testData || !testData.history || testData.history.length < 2) return;

    const history = testData.history;
    const today = testData.today;

    // Calculate average of last 2 days
    const last = history[history.length - 1];
    const secondLast = history[history.length - 2];
    const avg = (last + secondLast) / 2;

    // Calculate growth rate
    const growthRate = avg > 0 ? (today - avg) / avg : 0;
    
    // Determine risk level based on growth rate
    let riskLevel = 'low';
    let confidence = history.length >= 5 ? 0.85 : 0.65;
    
    if (growthRate > 1.5) { // 150% increase
      riskLevel = 'critical';
    } else if (growthRate > 0.8) { // 80% increase
      riskLevel = 'high';
    } else if (growthRate > 0.4) { // 40% increase
      riskLevel = 'medium';
    }

    // Alert if significant outbreak detected
    if (avg > 0 && today > 1.5 * avg) {
      // Get list of hospitals and pharmacies in this zone
      const zoneHospitals = Object.entries(this.worldState.hospitals)
        .filter(([_, h]) => h.zone === lab.zone)
        .map(([id, h]) => h.name || id);
      
      const zonePharmacies = Object.entries(this.worldState.pharmacies)
        .filter(([_, p]) => p.zone === lab.zone)
        .map(([id, p]) => p.name || id);

      this.log(
        `🚨 ${lab.name}: ${disease.toUpperCase()} OUTBREAK DETECTED! Tests: ${today} (+${(growthRate * 100).toFixed(0)}% spike) | Positive rate: ${((testData.positive/today) * 100).toFixed(1)}%`,
        { 
          agent: "Lab", 
          type: `OUTBREAK_DETECTED`, 
          entityId: this.id,
          zone: lab.zone,
          disease,
          riskLevel,
          confidence
        }
      );

      // Log coordination message
      this.log(
        `📡 ${lab.name}: Broadcasting ${disease.toUpperCase()} alert to ${zoneHospitals.length} hospitals & ${zonePharmacies.length} pharmacies in ${lab.zone}`,
        { 
          agent: "Lab", 
          type: `COORDINATION`, 
          entityId: this.id,
          zone: lab.zone,
          disease,
          recipients: {
            hospitals: zoneHospitals,
            pharmacies: zonePharmacies
          }
        }
      );

      // Publish outbreak prediction event
      publish(`${disease.toUpperCase()}_OUTBREAK_PREDICTED`, {
        labId: this.id,
        labName: lab.name,
        zone: lab.zone,
        disease,
        today,
        avg: avg.toFixed(1),
        growthRate: (growthRate * 100).toFixed(1),
        riskLevel,
        confidence,
        positiveRate: testData.positiveRate,
        predictedCases: Math.round(today * (1 + growthRate))
      });

      // Also publish generic outbreak event for backward compatibility
      if (disease === 'dengue') {
        publish("DENGUE_OUTBREAK_PREDICTED", {
          zone: lab.zone,
          today,
          avg,
        });
      }
    }
  }

  checkLabCapacity(lab) {
    const totalTests = Object.values(lab.testData).reduce((sum, data) => sum + data.today, 0);
    const totalCapacity = Object.values(lab.testData).reduce((sum, data) => sum + data.capacity, 0);
    const utilization = totalTests / totalCapacity;

    if (utilization > 0.85) {
      this.log(
        `[Lab ${this.id}] High capacity utilization: ${(utilization * 100).toFixed(1)}% (${totalTests}/${totalCapacity} tests)`,
        { agent: "Lab", type: "CAPACITY_WARNING", labId: this.id, utilization }
      );

      publish("LAB_CAPACITY_WARNING", {
        labId: this.id,
        zone: lab.zone,
        utilization,
        totalTests,
        totalCapacity,
        queueLength: lab.queueLength
      });
    }
  }
}

module.exports = LabAgent;
