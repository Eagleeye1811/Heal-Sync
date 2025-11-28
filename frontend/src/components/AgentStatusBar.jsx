// frontend/src/components/AgentStatusBar.jsx
// Visual Agent Status Bar - Shows all agents at a glance
import { useState, useEffect } from 'react';

function AgentStatusBar({ state, logs }) {
  const [agentActivity, setAgentActivity] = useState({
    lab: { active: false, lastAction: '' },
    hospital: { active: false, lastAction: '' },
    pharmacy: { active: false, lastAction: '' },
    supplier: { active: false, lastAction: '' },
    city: { active: false, lastAction: '' }
  });

  // Track recent agent activity (last 5 seconds)
  useEffect(() => {
    if (!logs || logs.length === 0) return;

    const recentLogs = logs.slice(-10);
    const now = Date.now();

    const activity = {
      lab: { active: false, lastAction: 'Monitoring' },
      hospital: { active: false, lastAction: 'Monitoring' },
      pharmacy: { active: false, lastAction: 'Monitoring' },
      supplier: { active: false, lastAction: 'Monitoring' },
      city: { active: false, lastAction: 'Coordinating' }
    };

    recentLogs.forEach(log => {
      if (!log.meta || !log.timestamp) return;
      
      const logTime = new Date(log.timestamp).getTime();
      const age = now - logTime;
      
      // Consider active if logged in last 5 seconds
      if (age < 5000) {
        const agent = log.meta.agent?.toLowerCase();
        
        if (agent === 'lab') {
          activity.lab.active = true;
          if (log.meta.type === 'OUTBREAK_DETECTED') activity.lab.lastAction = '🚨 Outbreak Detected!';
          else if (log.meta.type === 'STATUS') activity.lab.lastAction = 'Analyzing Tests';
        } else if (agent === 'hospital') {
          activity.hospital.active = true;
          if (log.meta.type === 'BED_ALLOCATION') activity.hospital.lastAction = '🛏️ Preparing Beds';
          else if (log.meta.type === 'ALERT_RECEIVED') activity.hospital.lastAction = '⚠️ Alert Received';
          else activity.hospital.lastAction = 'Managing Capacity';
        } else if (agent === 'pharmacy') {
          activity.pharmacy.active = true;
          if (log.meta.type === 'ORDER_PLACED') activity.pharmacy.lastAction = '📦 Ordering Medicine';
          else if (log.meta.type === 'COORDINATION') activity.pharmacy.lastAction = '📡 Coordinating';
          else activity.pharmacy.lastAction = 'Monitoring Stock';
        } else if (agent === 'supplier') {
          activity.supplier.active = true;
          if (log.meta.type === 'ORDER_CONFIRMED') activity.supplier.lastAction = '✅ Order Confirmed';
          else if (log.meta.type === 'DELIVERY') activity.supplier.lastAction = '🚚 Dispatching';
          else activity.supplier.lastAction = 'Processing Orders';
        } else if (agent === 'city') {
          activity.city.active = true;
          if (log.meta.type === 'SCENARIO_TRIGGER') activity.city.lastAction = '🎮 Scenario Active';
          else activity.city.lastAction = 'City-wide Monitoring';
        }
      }
    });

    setAgentActivity(activity);
  }, [logs]);

  const agents = [
    { 
      key: 'lab', 
      icon: '🔬', 
      name: 'Lab', 
      color: 'from-green-600 to-emerald-600',
      borderColor: 'border-green-500',
      count: Object.keys(state?.labs || {}).length 
    },
    { 
      key: 'hospital', 
      icon: '🏥', 
      name: 'Hospital', 
      color: 'from-blue-600 to-cyan-600',
      borderColor: 'border-blue-500',
      count: Object.keys(state?.hospitals || {}).length 
    },
    { 
      key: 'pharmacy', 
      icon: '💊', 
      name: 'Pharmacy', 
      color: 'from-purple-600 to-pink-600',
      borderColor: 'border-purple-500',
      count: Object.keys(state?.pharmacies || {}).length 
    },
    { 
      key: 'supplier', 
      icon: '📦', 
      name: 'Supplier', 
      color: 'from-orange-600 to-amber-600',
      borderColor: 'border-orange-500',
      count: Object.keys(state?.suppliers || {}).length 
    },
    { 
      key: 'city', 
      icon: '🏙️', 
      name: 'City', 
      color: 'from-indigo-600 to-purple-600',
      borderColor: 'border-indigo-500',
      count: 1 
    },
  ];

  return (
    <div className="bg-slate-800/50 border-y border-slate-700 py-4 mb-6">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400">🤖 AI AGENT NETWORK STATUS</h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-xs text-slate-400">Live Monitoring</span>
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-3">
          {agents.map(agent => {
            const activity = agentActivity[agent.key];
            const isActive = activity?.active;
            
            return (
              <div
                key={agent.key}
                className={`relative bg-gradient-to-br ${agent.color} ${isActive ? 'animate-pulse' : 'opacity-70'} 
                  rounded-lg p-4 border-2 ${agent.borderColor} transition-all duration-300 ${isActive ? 'scale-105 shadow-lg' : ''}`}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                )}
                
                <div className="text-center">
                  <div className="text-4xl mb-2">{agent.icon}</div>
                  <div className="font-bold text-white text-sm mb-1">{agent.name}</div>
                  <div className="text-xs text-white/80 mb-2">
                    {agent.count} {agent.count === 1 ? 'Agent' : 'Agents'}
                  </div>
                  <div className="text-[10px] text-white/70 font-semibold">
                    {activity?.lastAction || 'Monitoring'}
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="absolute bottom-2 left-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${isActive ? 'bg-yellow-300' : 'bg-green-400'}`}></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Coordination Indicator */}
        {Object.values(agentActivity).some(a => a.active) && (
          <div className="mt-3 text-center">
            <span className="inline-flex items-center gap-2 bg-yellow-900/30 border border-yellow-600 rounded-full px-4 py-1 text-xs text-yellow-300 font-bold animate-pulse">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
              ACTIVE COORDINATION IN PROGRESS
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentStatusBar;

