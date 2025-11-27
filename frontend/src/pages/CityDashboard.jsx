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

      // Auto scroll to bottom
      setTimeout(() => {
        if (logContainerRef.current) {
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

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 p-4 gap-4">
      {/* LEFT SIDE: Controls + State */}
      <div className="w-2/3 space-y-4">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              HealSync – City Command Center
            </h1>
            <p className="text-sm text-slate-400">
              Watch agents react to outbreaks, capacity risks, and shortages.
            </p>
            {user && (
              <p className="text-xs text-blue-400 mt-2">
                👤 Logged in as: {user.entityName || user.role}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm"
            >
              🏠 Public View
            </button>
            {user && (
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
              >
                🚪 Logout
              </button>
            )}
          </div>
        </header>

        {/* Scenario Control Panel */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="font-semibold mb-3 text-slate-200 flex items-center gap-2">
            🎮 Demo Scenarios
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {scenarios.map((scenario) => (
              <button
                key={scenario.endpoint}
                onClick={() => triggerScenario(scenario.name, scenario.endpoint)}
                className={`${scenario.color} px-3 py-2 rounded text-xs font-medium transition-colors flex items-center gap-2`}
                title={scenario.desc}
              >
                <span className="text-lg">{scenario.icon}</span>
                <span>{scenario.name}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Click any scenario to trigger real-time agent coordination
          </p>
        </div>

        {/* Raw State Viewer for Debugging */}
        <div className="bg-slate-800 rounded p-3 text-xs overflow-auto max-h-[70vh]">
          <h2 className="font-semibold mb-2 text-sm">
            Raw World State (Debug View)
          </h2>
          {state ? (
            <pre>{JSON.stringify(state, null, 2)}</pre>
          ) : (
            <div>Loading state...</div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Logs */}
      <div
        ref={logContainerRef}
        className="w-1/3 bg-slate-800 rounded p-3 overflow-y-auto max-h-[90vh]"
      >
        <h2 className="font-semibold mb-2 text-sm uppercase tracking-wide text-slate-300">
          Agent Activity Logs
        </h2>
        <p className="text-[11px] text-slate-400 mb-2">
          Colored by agent type. "New Activity" marks a fresh burst of agent
          actions. "Dengue Spike Triggered" is added when you simulate a spike.
        </p>

        <ul className="space-y-1 text-xs">
          {logs.length === 0 && (
            <li className="text-slate-400 text-xs">
              Waiting for agent activity...
            </li>
          )}

          {logs.map((log, i) =>
            log.separator ? (
              <li
                key={i}
                className="text-center text-[10px] text-yellow-400 font-semibold my-2 py-1 border-y border-yellow-500"
              >
                ── {log.label || "New Activity"} ──
              </li>
            ) : (
              <li key={i} className="border-b border-slate-700 pb-1">
                <div className="flex items-center justify-between">
                  <div className="text-slate-400 text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                  {log.meta && log.meta.agent && (
                    <div
                      className={
                        "text-[10px] font-semibold ml-2 " +
                        getAgentColorClass(log.meta.agent)
                      }
                    >
                      [{log.meta.agent}]
                    </div>
                  )}
                </div>
                <div>{log.message}</div>
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
}

export default CityDashboard;

