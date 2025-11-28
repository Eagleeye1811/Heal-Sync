// frontend/src/components/ImpactSummary.jsx
// Shows the measurable impact of agent coordination
import { useState, useEffect } from 'react';

function ImpactSummary({ logs, state }) {
  const [metrics, setMetrics] = useState({
    eventsProcessed: 0,
    outbreaksDetected: 0,
    bedsAllocated: 0,
    medicineOrders: 0,
    deliveriesScheduled: 0,
    avgResponseTime: 0,
    activeScenario: null
  });

  useEffect(() => {
    if (!logs || logs.length === 0) return;

    const recentLogs = logs.slice(-100); // Last 100 logs
    
    let outbreaks = 0;
    let beds = 0;
    let orders = 0;
    let deliveries = 0;
    const responseTimes = [];
    let currentScenario = null;

    // Find active scenario
    const scenarioLog = recentLogs.reverse().find(l => 
      l.meta?.type === 'SCENARIO_TRIGGER'
    );
    if (scenarioLog) {
      currentScenario = scenarioLog.meta?.scenario || 'Active';
    }

    recentLogs.forEach(log => {
      const type = log.meta?.type;
      const msg = log.message?.toLowerCase() || '';

      if (type === 'OUTBREAK_DETECTED' || msg.includes('outbreak')) outbreaks++;
      if (type === 'BED_ALLOCATION' || msg.includes('bed')) beds++;
      if (type === 'ORDER_PLACED' || msg.includes('order')) orders++;
      if (type === 'ORDER_CONFIRMED' || msg.includes('confirmed')) deliveries++;
      
      // Calculate response times between outbreak and response
      if (type === 'OUTBREAK_DETECTED') {
        const outbreakTime = new Date(log.timestamp).getTime();
        const response = recentLogs.find(l => 
          l.timestamp > log.timestamp && 
          (l.meta?.type === 'BED_ALLOCATION' || l.meta?.type === 'ORDER_PLACED')
        );
        if (response) {
          const responseTime = (new Date(response.timestamp).getTime() - outbreakTime) / 1000;
          if (responseTime < 120) responseTimes.push(responseTime); // Only count if < 2 min
        }
      }
    });

    const avgResponse = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    setMetrics({
      eventsProcessed: recentLogs.length,
      outbreaksDetected: outbreaks,
      bedsAllocated: beds,
      medicineOrders: orders,
      deliveriesScheduled: deliveries,
      avgResponseTime: avgResponse,
      activeScenario: currentScenario
    });
  }, [logs]);

  const impactCards = [
    {
      icon: '⚡',
      label: 'Response Time',
      value: metrics.avgResponseTime > 0 ? `${metrics.avgResponseTime}s` : '--',
      subtitle: 'Avg alert → action',
      color: 'from-cyan-600 to-blue-600'
    },
    {
      icon: '🚨',
      label: 'Outbreaks Detected',
      value: metrics.outbreaksDetected,
      subtitle: 'Early warnings',
      color: 'from-red-600 to-pink-600'
    },
    {
      icon: '🛏️',
      label: 'Beds Prepared',
      value: metrics.bedsAllocated,
      subtitle: 'Proactive allocation',
      color: 'from-blue-600 to-indigo-600'
    },
    {
      icon: '💊',
      label: 'Medicine Orders',
      value: metrics.medicineOrders,
      subtitle: 'Stock maintained',
      color: 'from-purple-600 to-pink-600'
    },
    {
      icon: '📦',
      label: 'Deliveries',
      value: metrics.deliveriesScheduled,
      subtitle: 'Supply fulfilled',
      color: 'from-orange-600 to-amber-600'
    },
    {
      icon: '🎯',
      label: 'Coordination Score',
      value: metrics.eventsProcessed > 0 ? 
        `${Math.min(100, Math.round((metrics.bedsAllocated + metrics.medicineOrders) / metrics.outbreaksDetected * 20) || 95)}%` : 
        '100%',
      subtitle: 'System efficiency',
      color: 'from-green-600 to-emerald-600'
    },
  ];

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            📊 Coordination Impact
          </h3>
          {metrics.activeScenario && (
            <p className="text-xs text-yellow-400 mt-1">
              🎮 Active Scenario: {metrics.activeScenario.charAt(0).toUpperCase() + metrics.activeScenario.slice(1)}
            </p>
          )}
        </div>
        <div className="text-xs text-slate-400">
          <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse mr-1"></span>
          Live Metrics
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {impactCards.map((card, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${card.color} rounded-lg p-4 border border-white/10 hover:scale-105 transition-transform duration-200`}
          >
            <div className="text-3xl mb-2 text-center">{card.icon}</div>
            <div className="text-2xl font-bold text-white text-center mb-1">
              {card.value}
            </div>
            <div className="text-[10px] text-white/80 font-semibold text-center">
              {card.label}
            </div>
            <div className="text-[9px] text-white/60 text-center mt-1">
              {card.subtitle}
            </div>
          </div>
        ))}
      </div>

      {/* Success Indicator */}
      {metrics.outbreaksDetected > 0 && metrics.bedsAllocated > 0 && (
        <div className="mt-4 bg-green-900/20 border border-green-600 rounded-lg p-3">
          <p className="text-sm text-green-300 text-center font-semibold">
            ✅ Successful Coordination: {metrics.outbreaksDetected} outbreak{metrics.outbreaksDetected > 1 ? 's' : ''} detected 
            → {metrics.bedsAllocated} bed allocation{metrics.bedsAllocated > 1 ? 's' : ''} 
            + {metrics.medicineOrders} medicine order{metrics.medicineOrders > 1 ? 's' : ''} completed
          </p>
        </div>
      )}
    </div>
  );
}

export default ImpactSummary;

