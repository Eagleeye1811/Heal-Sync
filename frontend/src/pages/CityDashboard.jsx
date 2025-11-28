// frontend/src/pages/CityDashboard.jsx - COMPLETE REBUILD
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import AgentStatusBar from '../components/AgentStatusBar';
import CoordinationTimeline from '../components/CoordinationTimeline';
import ImpactSummary from '../components/ImpactSummary';
import AgentNetworkDiagram from '../components/AgentNetworkDiagram';
import ScenarioProgress from '../components/ScenarioProgress';

function CityDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [state, setState] = useState(null);
  const [autoDemoActive, setAutoDemoActive] = useState(false);
  const [currentScenario, setCurrentScenario] = useState('');
  
  const autoDemoIntervalRef = useRef(null);
  const socketRef = useRef(null);
  const lastLogTimeRef = useRef(null);

  // WebSocket connection for real-time logs
  useEffect(() => {
    const socket = io("http://localhost:4000");
    socketRef.current = socket;

    socket.on("connected", (data) => {
      console.log("Socket connected:", data.msg);
    });

    socket.on("agent-log", (entry) => {
      const now = Date.now();
      const last = lastLogTimeRef.current;
      const GAP_MS = 5000; // 5s gap => new activity separator

      setLogs((prev) => {
        const next = [...prev];

        // Add separator if there was a gap
        if (last && now - last > GAP_MS) {
          next.push({
            separator: true,
            label: "New Activity",
            timestamp: entry.timestamp,
          });
        }

        next.push(entry);
        return next.slice(-200); // Keep last 200 logs
      });

      lastLogTimeRef.current = now;
    });

    return () => {
      socket.off("connected");
      socket.off("agent-log");
      socket.disconnect();
    };
  }, []);

  // Fetch world state periodically
  useEffect(() => {
    const fetchState = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/state");
        const data = await response.json();
        setState(data);
      } catch (error) {
        console.error("Error fetching state:", error);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 2000); // Update every 2s

    return () => clearInterval(interval);
  }, []);

  // Auto-demo mode - cycles through scenarios
  const startAutoDemo = () => {
    if (autoDemoActive) {
      clearInterval(autoDemoIntervalRef.current);
      setAutoDemoActive(false);
      setCurrentScenario('');
      return;
    }

    setAutoDemoActive(true);
    const scenarios = ['dengue', 'malaria', 'covid', 'heatwave'];
    let index = 0;

    const triggerNext = async () => {
      const scenario = scenarios[index];
      setCurrentScenario(scenario);
      
      try {
        await fetch(`http://localhost:4000/api/simulate/${scenario}`, { method: 'POST' });
      } catch (error) {
        console.error("Error triggering scenario:", error);
      }

      index = (index + 1) % scenarios.length;
    };

    triggerNext(); // Trigger first scenario immediately
    autoDemoIntervalRef.current = setInterval(triggerNext, 30000); // Every 30 seconds
  };

  // Manual scenario triggers
  const triggerScenario = async (scenario) => {
    try {
      await fetch(`http://localhost:4000/api/simulate/${scenario}`, { method: 'POST' });
    } catch (error) {
      console.error("Error triggering scenario:", error);
    }
  };

  const resetSystem = async () => {
    try {
      await fetch("http://localhost:4000/api/simulate/reset", { method: 'POST' });
      setLogs([]);
    } catch (error) {
      console.error("Error resetting:", error);
    }
  };

  // Calculate city-wide metrics
  const totalBeds = state?.city?.totalResources?.beds?.total || 180;
  const usedBeds = state?.city?.totalResources?.beds?.used || 0;
  const availableBeds = totalBeds - usedBeds;
  const bedUtilization = totalBeds > 0 ? Math.round((usedBeds / totalBeds) * 100) : 0;

  const diseases = state?.diseases || {};
  const totalActiveCases = Object.values(diseases).reduce((sum, d) => sum + (d.activeCases || 0), 0);

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical':
        return { bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-400', emoji: '🔴' };
      case 'high':
        return { bg: 'bg-orange-900/30', border: 'border-orange-700', text: 'text-orange-400', emoji: '🟠' };
      case 'medium':
        return { bg: 'bg-yellow-900/30', border: 'border-yellow-700', text: 'text-yellow-400', emoji: '🟡' };
      default:
        return { bg: 'bg-green-900/30', border: 'border-green-700', text: 'text-green-400', emoji: '🟢' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-700 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="text-slate-400 hover:text-white transition"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  🏙️ HealSync City Control Center
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  AI-Powered Health Coordination Network
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-bold text-purple-300">{user?.name || 'City Admin'}</p>
                <p className="text-[10px] text-slate-400">{user?.role || 'CITY'}</p>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Scenario Control Panel */}
          <div className="mt-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300">🎮 Scenario Controls</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => triggerScenario('dengue')}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs transition"
                >
                  🦟 Dengue
                </button>
                <button
                  onClick={() => triggerScenario('malaria')}
                  className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-xs transition"
                >
                  🦟 Malaria
                </button>
                <button
                  onClick={() => triggerScenario('covid')}
                  className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-xs transition"
                >
                  😷 COVID
                </button>
                <button
                  onClick={() => triggerScenario('heatwave')}
                  className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-xs transition"
                >
                  ☀️ Heatwave
                </button>
                <button
                  onClick={startAutoDemo}
                  className={`${autoDemoActive ? 'bg-green-600' : 'bg-blue-600'} hover:opacity-80 px-3 py-1 rounded text-xs transition flex items-center gap-1`}
                >
                  {autoDemoActive ? '⏹️ Stop' : '▶️ Auto Demo'}
                </button>
                <button
                  onClick={resetSystem}
                  className="bg-slate-600 hover:bg-slate-700 px-3 py-1 rounded text-xs transition"
                >
                  🔄 Reset
                </button>
              </div>
            </div>
            {autoDemoActive && (
              <p className="text-xs text-green-400 mt-2 text-center animate-pulse">
                🎬 Auto-demo running: {currentScenario.toUpperCase()} → Next scenario in 30s
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Agent Status Bar */}
      <AgentStatusBar state={state} logs={logs} />

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Active Scenario Progress */}
        <ScenarioProgress logs={logs} />

        {/* Impact Summary */}
        <ImpactSummary logs={logs} state={state} />

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT: Agent Network Visualization */}
          <AgentNetworkDiagram logs={logs} state={state} />

          {/* RIGHT: City Stats */}
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg p-4 border border-blue-400">
                <div className="text-3xl mb-1">🛏️</div>
                <div className="text-3xl font-bold text-white">{availableBeds}</div>
                <div className="text-xs text-white/80 mt-1">Beds Available</div>
                <div className="text-[10px] text-white/60 mt-1">{bedUtilization}% utilized</div>
              </div>
              <div className="bg-gradient-to-br from-red-600 to-pink-600 rounded-lg p-4 border border-red-400">
                <div className="text-3xl mb-1">🦠</div>
                <div className="text-3xl font-bold text-white">{totalActiveCases}</div>
                <div className="text-xs text-white/80 mt-1">Active Cases</div>
                <div className="text-[10px] text-white/60 mt-1">5 diseases tracked</div>
              </div>
            </div>

            {/* Zone Health */}
            {state?.city?.zones && (
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h3 className="text-sm font-bold mb-3">📍 Zone Health</h3>
                <div className="space-y-2">
                  {Object.entries(state.city.zones).map(([zoneId, zone]) => {
                    const riskData = state.city.riskZones?.[zoneId];
                    const riskLevel = riskData?.overall || 'low';
                    const colors = getRiskColor(riskLevel);
                    
                    return (
                      <div
                        key={zoneId}
                        className={`${colors.bg} border ${colors.border} rounded p-3 flex items-center justify-between`}
                      >
                        <div>
                          <p className="text-sm font-bold text-white">{zone.name}</p>
                          <p className="text-[10px] text-slate-400">👥 {zone.population.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl">{colors.emoji}</div>
                          <p className={`text-[9px] font-bold ${colors.text}`}>{riskLevel.toUpperCase()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full Width Coordination Timeline */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              ⚡ Agent Coordination Timeline
            </h2>
            <span className="text-xs text-slate-400">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse mr-1"></span>
              Live Updates
            </span>
          </div>
          <CoordinationTimeline logs={logs} />
        </div>
      </div>
    </div>
  );
}

export default CityDashboard;

