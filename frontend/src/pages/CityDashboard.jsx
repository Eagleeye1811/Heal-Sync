// frontend/src/pages/CityDashboard.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

function CityDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [state, setState] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const logContainerRef = useRef(null);
  const socketRef = useRef(null);
  const lastLogTimeRef = useRef(null); // for automatic "New Activity"

  // Color class based on agent type
  const getAgentColorClass = (agent) => {
    switch (agent) {
      case "Lab":
        return "text-green-400";
      case "Hospital":
        return "text-blue-400";
      case "Pharmacy":
        return "text-teal-400";
      case "Supplier":
        return "text-orange-400";
      case "City":
        return "text-purple-400";
      default:
        return "text-slate-200";
    }
  };

  // WebSocket connection + log handling
  useEffect(() => {
    const socket = io("http://localhost:4000");
    socketRef.current = socket;

    socket.on("connected", (data) => {
      console.log("Socket connected:", data.msg);
    });

    socket.on("agent-log", (entry) => {
      const now = Date.now();
      const last = lastLogTimeRef.current;
      const GAP_MS = 5000; // 5s gap => new activity

      setLogs((prev) => {
        const next = [...prev];

        // If there was a long gap since the last log, start a new activity block
        if (last && now - last > GAP_MS) {
          next.push({
            separator: true,
            label: "New Activity",
            timestamp: entry.timestamp,
          });
        }

        // Always append the log itself
        next.push(entry);

        return next.slice(-200);
      });

      lastLogTimeRef.current = now;

      // Auto scroll to bottom only if autoScroll is enabled
      setTimeout(() => {
        if (logContainerRef.current && autoScroll) {
          logContainerRef.current.scrollTo({
            top: logContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 50);
    });

    return () => {
      socket.off("connected");
      socket.off("agent-log");
      socket.disconnect();
    };
  }, [autoScroll]);

  // Handle scroll detection to show/hide scroll button
  useEffect(() => {
    const container = logContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      // If user scrolled up, disable auto-scroll and show button
      if (!isNearBottom) {
        setAutoScroll(false);
        setShowScrollButton(true);
      } else {
        // If user is at bottom, enable auto-scroll and hide button
        setAutoScroll(true);
        setShowScrollButton(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Poll /api/state every 3 seconds
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/state");
        const json = await res.json();
        setState(json);
      } catch (err) {
        console.error("Error fetching state:", err);
      }
    };

    fetchState();
    const id = setInterval(fetchState, 3000);
    return () => clearInterval(id);
  }, []);

  // Scenario triggers
  const triggerScenario = async (scenarioName, endpoint) => {
    setLogs((prev) => [
      ...prev,
      {
        separator: true,
        label: `${scenarioName} Triggered`,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      const response = await fetch(`http://localhost:4000/api/simulate/${endpoint}`, {
        method: "POST",
      });
      const data = await response.json();
      console.log(`${scenarioName}:`, data);
    } catch (err) {
      console.error(`Error triggering ${scenarioName}:`, err);
    }
  };

  const scenarios = [
    { name: 'Dengue Outbreak', endpoint: 'dengue', icon: '🦟', color: 'bg-red-600 hover:bg-red-700', desc: 'Spike in dengue tests and cases' },
    { name: 'Malaria Outbreak', endpoint: 'malaria', icon: '🦟', color: 'bg-orange-600 hover:bg-orange-700', desc: 'Increase in malaria infections' },
    { name: 'COVID Surge', endpoint: 'covid', icon: '😷', color: 'bg-purple-600 hover:bg-purple-700', desc: 'ICU and isolation beds filling up' },
    { name: 'Heatwave', endpoint: 'heatwave', icon: '🌡️', color: 'bg-yellow-600 hover:bg-yellow-700', desc: 'Extreme heat, hospital admissions rise' },
    { name: 'Hospital Overload', endpoint: 'hospital-overload', icon: '🏥', color: 'bg-blue-600 hover:bg-blue-700', desc: 'Zone-2 hospitals at 95% capacity' },
    { name: 'Medicine Shortage', endpoint: 'medicine-shortage', icon: '💊', color: 'bg-pink-600 hover:bg-pink-700', desc: 'Deplete antivirals and antibiotics' },
    { name: 'Reset System', endpoint: 'reset', icon: '🔄', color: 'bg-green-600 hover:bg-green-700', desc: 'Return to baseline state' },
  ];

  // Helper functions for better log interpretation
  const getLogIcon = (message) => {
    const msg = message.toLowerCase();
    if (msg.includes('outbreak') || msg.includes('alert')) return '🚨';
    if (msg.includes('bed') || msg.includes('capacity')) return '🛏️';
    if (msg.includes('medicine') || msg.includes('stock')) return '💊';
    if (msg.includes('order') || msg.includes('delivery')) return '📦';
    if (msg.includes('test') || msg.includes('lab')) return '🔬';
    if (msg.includes('prepare') || msg.includes('ready')) return '✅';
    if (msg.includes('risk') || msg.includes('zone')) return '📍';
    return '📝';
  };

  const getLogCategory = (message) => {
    const msg = message.toLowerCase();
    if (msg.includes('outbreak') || msg.includes('alert')) return 'Critical';
    if (msg.includes('order') || msg.includes('prepare')) return 'Action';
    if (msg.includes('monitor') || msg.includes('check')) return 'Monitoring';
    return 'Info';
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Critical': return 'bg-red-900/30 border-red-700';
      case 'Action': return 'bg-blue-900/30 border-blue-700';
      case 'Monitoring': return 'bg-green-900/30 border-green-700';
      default: return 'bg-slate-700/30 border-slate-600';
    }
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTo({
        top: logContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
      setAutoScroll(true);
      setShowScrollButton(false);
    }
  };

  // Calculate metrics from state
  const totalActiveCases = state?.city?.diseaseStats 
    ? Object.values(state.city.diseaseStats).reduce((sum, disease) => sum + (disease.activeCases || 0), 0)
    : 0;

  const bedUtilization = state?.city?.totalResources?.beds
    ? Math.round(((state.city.totalResources.beds.total - state.city.totalResources.beds.available) / 
       state.city.totalResources.beds.total) * 100)
    : 0;

  const getUtilizationColor = (percent) => {
    if (percent >= 85) return 'text-red-400';
    if (percent >= 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high':
      case 'critical':
        return { bg: 'bg-red-900/30', border: 'border-red-600', text: 'text-red-400', emoji: '🔴' };
      case 'medium':
        return { bg: 'bg-yellow-900/30', border: 'border-yellow-600', text: 'text-yellow-400', emoji: '🟡' };
      default:
        return { bg: 'bg-green-900/30', border: 'border-green-600', text: 'text-green-400', emoji: '🟢' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                🏙️ HealSync – City Command Center
              </h1>
              <p className="text-sm text-slate-400">
                Real-time multi-agent coordination and system oversight
              </p>
              {user && (
                <p className="text-xs text-blue-400 mt-1">
                  👤 {user.entityName || user.role}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/')}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                🏠 Public View
              </button>
              {user && (
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  🚪 Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: Metrics & Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-4 gap-4">
              {/* Beds Available */}
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700 rounded-lg p-4">
                <div className="text-3xl mb-2">🛏️</div>
                <div className={`text-3xl font-bold ${getUtilizationColor(bedUtilization)}`}>
                  {state?.city?.totalResources?.beds?.available || 0}
                </div>
                <div className="text-xs text-slate-400 mt-1">Beds Available</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {bedUtilization}% utilized
                </div>
              </div>

              {/* Active Cases */}
              <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-700 rounded-lg p-4">
                <div className="text-3xl mb-2">🦠</div>
                <div className="text-3xl font-bold text-red-400">
                  {totalActiveCases}
                </div>
                <div className="text-xs text-slate-400 mt-1">Active Cases</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Across 5 diseases
                </div>
              </div>

              {/* AI Agents */}
              <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700 rounded-lg p-4">
                <div className="text-3xl mb-2">🤖</div>
                <div className="text-3xl font-bold text-green-400">12</div>
                <div className="text-xs text-slate-400 mt-1">Agents Active</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse"></span> Monitoring
                </div>
              </div>

              {/* Active Alerts */}
              <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border border-yellow-700 rounded-lg p-4">
                <div className="text-3xl mb-2">⚠️</div>
                <div className="text-3xl font-bold text-yellow-400">
                  {state?.city?.activeAlerts?.length || 0}
                </div>
                <div className="text-xs text-slate-400 mt-1">Active Alerts</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  System health
                </div>
              </div>
            </div>

            {/* Zone Health Status */}
            {state?.city?.zones && (
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  📍 Zone Health Status
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(state.city.zones).map(([zoneId, zone]) => {
                    const riskData = state.city.riskZones?.[zoneId];
                    const riskLevel = riskData?.overall || 'low';
                    const colors = getRiskColor(riskLevel);
                    
                    return (
                      <div
                        key={zoneId}
                        className={`${colors.bg} border-2 ${colors.border} rounded-lg p-4`}
                      >
                        <div className="text-center mb-2">
                          <div className="text-4xl mb-1">{colors.emoji}</div>
                          <h4 className="font-bold text-slate-200">{zone.name}</h4>
                          <p className="text-xs text-slate-400">{zoneId}</p>
                        </div>
                        <div className={`text-xs font-semibold ${colors.text} text-center mt-2`}>
                          {riskLevel.toUpperCase()} RISK
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-600 text-[10px] text-slate-400">
                          <div>👥 {zone.population.toLocaleString()}</div>
                          <div>🏥 {zone.hospitals.length} Hospitals</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scenario Control Panel */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                🎮 Demo Scenarios
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.endpoint}
                    onClick={() => triggerScenario(scenario.name, scenario.endpoint)}
                    className={`${scenario.color} px-4 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105 flex items-center gap-3`}
                    title={scenario.desc}
                  >
                    <span className="text-2xl">{scenario.icon}</span>
                    <div className="text-left">
                      <div>{scenario.name}</div>
                      <div className="text-[10px] opacity-75">{scenario.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Disease Surveillance */}
            {state?.city?.diseaseStats && (
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  🦠 Disease Surveillance
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(state.city.diseaseStats).map(([disease, stats]) => (
                    <div key={disease} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                      <h4 className="font-semibold capitalize text-sm mb-2">{disease}</h4>
                      <div className="text-2xl font-bold text-red-400">{stats.activeCases}</div>
                      <div className="text-[10px] text-slate-400">cases</div>
                      <div className="text-[10px] text-green-400 mt-1">+{stats.newToday} today</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Activity Logs */}
          <div className="space-y-6">
            {/* Agent Status */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                🤖 AI Agent Status
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-green-900/20 border border-green-700 rounded p-2">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-green-400 font-semibold">Lab (2)</span>
                  </span>
                  <span className="text-slate-400">Testing</span>
                </div>
                <div className="flex items-center justify-between bg-blue-900/20 border border-blue-700 rounded p-2">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                    <span className="text-blue-400 font-semibold">Hospital (4)</span>
                  </span>
                  <span className="text-slate-400">Capacity</span>
                </div>
                <div className="flex items-center justify-between bg-teal-900/20 border border-teal-700 rounded p-2">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></span>
                    <span className="text-teal-400 font-semibold">Pharmacy (3)</span>
                  </span>
                  <span className="text-slate-400">Inventory</span>
                </div>
                <div className="flex items-center justify-between bg-orange-900/20 border border-orange-700 rounded p-2">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                    <span className="text-orange-400 font-semibold">Supplier (2)</span>
                  </span>
                  <span className="text-slate-400">Logistics</span>
                </div>
                <div className="flex items-center justify-between bg-purple-900/20 border border-purple-700 rounded p-2">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                    <span className="text-purple-400 font-semibold">City (1)</span>
                  </span>
                  <span className="text-slate-400">Coordination</span>
                </div>
              </div>
            </div>

            {/* Activity Logs */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 relative">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  📊 Real-Time Activity Feed
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Live agent coordination and decision-making
                </p>
              </div>

              <div
                ref={logContainerRef}
                className="p-3 overflow-y-auto max-h-[600px] relative"
              >
                {logs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">⏳</div>
                    <p className="text-sm text-slate-400">Waiting for agent activity...</p>
                    <p className="text-xs text-slate-500 mt-1">Trigger a scenario to see agents in action</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log, i) =>
                      log.separator ? (
                        <div
                          key={i}
                          className="text-center text-xs text-yellow-400 font-bold my-3 py-2 bg-yellow-900/20 border-y border-yellow-500 rounded"
                        >
                          🎯 {log.label || "New Activity"}
                        </div>
                      ) : (
                        <div
                          key={i}
                          className={`rounded-lg p-3 border ${getCategoryColor(getLogCategory(log.message))}`}
                        >
                          {/* Header */}
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-2xl">{getLogIcon(log.message)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                {log.meta && log.meta.agent && (
                                  <span
                                    className={`text-xs font-bold ${getAgentColorClass(log.meta.agent)}`}
                                  >
                                    {log.meta.agent} Agent
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-500">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="text-xs text-slate-200 break-words">
                                {log.message}
                              </div>
                            </div>
                          </div>

                          {/* Category Badge */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                              {getLogCategory(log.message)}
                            </span>
                            {log.meta?.entityId && (
                              <span className="text-[10px] text-slate-500">
                                ID: {log.meta.entityId}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Scroll to Bottom Button */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all animate-bounce z-10"
                  title="Scroll to latest activity"
                >
                  <span>↓</span>
                  <span className="text-sm font-medium">New Activity</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CityDashboard;

