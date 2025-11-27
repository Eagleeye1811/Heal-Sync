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

    // Calculate total tests and positive rates
    const diseases = ['dengue', 'malaria', 'typhoid', 'influenza', 'covid'];
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
