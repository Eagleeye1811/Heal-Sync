// frontend/src/App.jsx
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

function App() {
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

  // Manual trigger for Dengue
  const simulateDengue = async () => {
    // Add ONLY Dengue Spike label here
    setLogs((prev) => [
      ...prev,
      {
        separator: true,
        label: "Dengue Spike Triggered",
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      await fetch("http://localhost:4000/api/simulate/dengue", {
        method: "POST",
      });
    } catch (err) {
      console.error("Error simulating dengue:", err);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 p-4 gap-4">
      {/* LEFT SIDE: Controls + State */}
      <div className="w-2/3 space-y-4">
        <header>
          <h1 className="text-2xl font-bold mb-1">
            HealSync – Citywide Health Dashboard (Practice)
          </h1>
          <p className="text-sm text-slate-400">
            Watch agents react to outbreaks, capacity risks, and shortages.
          </p>
        </header>

        {/* Scenario Buttons */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={simulateDengue}
            className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-medium"
          >
            Simulate Dengue Spike
          </button>
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

export default App;
