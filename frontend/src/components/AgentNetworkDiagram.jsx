// frontend/src/components/AgentNetworkDiagram.jsx
// Visual network showing agent connections and message flow
import { useState, useEffect } from 'react';

function AgentNetworkDiagram({ logs, state }) {
  const [activeConnections, setActiveConnections] = useState([]);

  // Track active communications in last 5 seconds
  useEffect(() => {
    if (!logs || logs.length === 0) return;

    const recentLogs = logs.slice(-20);
    const connections = [];
    const now = Date.now();

    recentLogs.forEach(log => {
      if (!log.meta || !log.timestamp) return;
      
      const age = now - new Date(log.timestamp).getTime();
      if (age > 5000) return; // Only last 5 seconds

      const type = log.meta.type;
      const agent = log.meta.agent?.toLowerCase();

      // Lab → Hospital, Pharmacy
      if (agent === 'lab' && (type === 'OUTBREAK_DETECTED' || type === 'COORDINATION')) {
        connections.push({ from: 'lab', to: 'hospital', pulse: true });
        connections.push({ from: 'lab', to: 'pharmacy', pulse: true });
      }

      // Hospital → Pharmacy
      if (agent === 'hospital' && type === 'COORDINATION') {
        connections.push({ from: 'hospital', to: 'pharmacy', pulse: true });
      }

      // Pharmacy → Supplier
      if (agent === 'pharmacy' && (type === 'ORDER_PLACED' || type === 'COORDINATION')) {
        connections.push({ from: 'pharmacy', to: 'supplier', pulse: true });
      }

      // Supplier → Pharmacy
      if (agent === 'supplier' && type === 'ORDER_CONFIRMED') {
        connections.push({ from: 'supplier', to: 'pharmacy', pulse: true });
      }

      // City → All
      if (agent === 'city' && type === 'SCENARIO_TRIGGER') {
        connections.push({ from: 'city', to: 'lab', pulse: true });
        connections.push({ from: 'city', to: 'hospital', pulse: true });
      }
    });

    setActiveConnections(connections);

    // Clear after 5 seconds
    const timeout = setTimeout(() => setActiveConnections([]), 5000);
    return () => clearTimeout(timeout);
  }, [logs]);

  const hasConnection = (from, to) => {
    return activeConnections.some(c => c.from === from && c.to === to);
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        🕸️ Agent Coordination Network
        <span className="text-xs text-slate-400 ml-2">(Live Communication Flow)</span>
      </h3>

      <div className="relative h-96 bg-slate-900/50 rounded-lg border border-slate-700 p-8">
        {/* City Agent (Center Top) */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <AgentNode 
            icon="🏙️" 
            name="City" 
            status="active"
            isActive={activeConnections.some(c => c.from === 'city')}
          />
        </div>

        {/* Lab (Top Left) */}
        <div className="absolute top-24 left-16">
          <AgentNode 
            icon="🔬" 
            name="Lab" 
            status="active"
            isActive={activeConnections.some(c => c.from === 'lab')}
          />
        </div>

        {/* Hospital (Top Right) */}
        <div className="absolute top-24 right-16">
          <AgentNode 
            icon="🏥" 
            name="Hospital" 
            status="active"
            isActive={activeConnections.some(c => c.from === 'hospital')}
          />
        </div>

        {/* Pharmacy (Bottom Left) */}
        <div className="absolute bottom-16 left-24">
          <AgentNode 
            icon="💊" 
            name="Pharmacy" 
            status="active"
            isActive={activeConnections.some(c => c.from === 'pharmacy')}
          />
        </div>

        {/* Supplier (Bottom Right) */}
        <div className="absolute bottom-16 right-24">
          <AgentNode 
            icon="📦" 
            name="Supplier" 
            status="active"
            isActive={activeConnections.some(c => c.from === 'supplier')}
          />
        </div>

        {/* SVG for Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* City → Lab */}
          {hasConnection('city', 'lab') && (
            <line x1="50%" y1="15%" x2="20%" y2="35%" 
              stroke="#10b981" strokeWidth="3" strokeDasharray="5,5"
              className="animate-pulse"
            >
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
            </line>
          )}

          {/* City → Hospital */}
          {hasConnection('city', 'hospital') && (
            <line x1="50%" y1="15%" x2="80%" y2="35%" 
              stroke="#3b82f6" strokeWidth="3" strokeDasharray="5,5"
              className="animate-pulse"
            >
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
            </line>
          )}

          {/* Lab → Hospital */}
          {hasConnection('lab', 'hospital') && (
            <line x1="25%" y1="35%" x2="75%" y2="35%" 
              stroke="#f59e0b" strokeWidth="3" strokeDasharray="5,5"
            >
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="0.8s" repeatCount="indefinite" />
            </line>
          )}

          {/* Lab → Pharmacy */}
          {hasConnection('lab', 'pharmacy') && (
            <line x1="20%" y1="40%" x2="22%" y2="75%" 
              stroke="#8b5cf6" strokeWidth="3" strokeDasharray="5,5"
            >
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="0.8s" repeatCount="indefinite" />
            </line>
          )}

          {/* Hospital → Pharmacy */}
          {hasConnection('hospital', 'pharmacy') && (
            <line x1="80%" y1="40%" x2="30%" y2="75%" 
              stroke="#ec4899" strokeWidth="3" strokeDasharray="5,5"
            >
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="0.8s" repeatCount="indefinite" />
            </line>
          )}

          {/* Pharmacy → Supplier */}
          {hasConnection('pharmacy', 'supplier') && (
            <line x1="30%" y1="80%" x2="70%" y2="80%" 
              stroke="#06b6d4" strokeWidth="3" strokeDasharray="5,5"
            >
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="0.8s" repeatCount="indefinite" />
            </line>
          )}

          {/* Supplier → Pharmacy */}
          {hasConnection('supplier', 'pharmacy') && (
            <line x1="70%" y1="75%" x2="35%" y2="75%" 
              stroke="#22c55e" strokeWidth="3" strokeDasharray="5,5"
            >
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="0.8s" repeatCount="indefinite" />
            </line>
          )}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-slate-900/80 border border-slate-600 rounded px-3 py-2">
          <p className="text-[10px] text-slate-400 mb-1">Legend:</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-[9px] text-slate-400">Active Agent</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <svg width="20" height="2">
              <line x1="0" y1="1" x2="20" y2="1" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3,3" />
            </svg>
            <span className="text-[9px] text-slate-400">Message Flow</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Agent Node Component
function AgentNode({ icon, name, status, isActive }) {
  return (
    <div className={`relative ${isActive ? 'animate-pulse' : ''}`}>
      {/* Glow effect when active */}
      {isActive && (
        <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl animate-ping"></div>
      )}
      
      <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${
        isActive ? 'from-yellow-500 to-orange-500' : 'from-slate-700 to-slate-800'
      } border-4 ${
        isActive ? 'border-yellow-400' : 'border-slate-600'
      } flex items-center justify-center transition-all duration-300 shadow-lg`}>
        <span className="text-3xl">{icon}</span>
      </div>
      
      <div className="text-center mt-2">
        <p className={`text-xs font-bold ${isActive ? 'text-yellow-300' : 'text-slate-400'}`}>
          {name}
        </p>
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></span>
          <span className="text-[9px] text-slate-500">
            {isActive ? 'ACTIVE' : 'Monitoring'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AgentNetworkDiagram;

