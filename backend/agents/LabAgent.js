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
    // Runs every 10 seconds
    setInterval(() => this.tick(), 10000);
  }

  tick() {
    const lab = this.worldState.labs[this.id];
    if (!lab) return;

    // Check all diseases for outbreaks
    const diseases = ['dengue', 'malaria', 'typhoid', 'influenza', 'covid'];
    
    diseases.forEach(disease => {
      this.checkDiseaseOutbreak(lab, disease);
    });
    
    // Check lab capacity
    this.checkLabCapacity(lab);
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
      this.log(
        `[Lab ${this.id}] ${disease.toUpperCase()} spike detected in ${lab.zone}: today=${today}, avg=${avg.toFixed(1)}, growth=${(growthRate * 100).toFixed(1)}%`,
        { 
          agent: "Lab", 
          type: `${disease.toUpperCase()}_ALERT`, 
          zone: lab.zone,
          disease,
          riskLevel,
          confidence
        }
      );

      // Publish outbreak prediction event
      publish(`${disease.toUpperCase()}_OUTBREAK_PREDICTED`, {
        labId: this.id,
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
