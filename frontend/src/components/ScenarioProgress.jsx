// frontend/src/components/ScenarioProgress.jsx
// Shows progress of ongoing outbreak scenarios
import { useState, useEffect } from 'react';

function ScenarioProgress({ logs }) {
  const [activeScenario, setActiveScenario] = useState(null);
  const [progress, setProgress] = useState(0);
  const [stages, setStages] = useState([]);

  useEffect(() => {
    if (!logs || logs.length === 0) return;

    const recentLogs = logs.slice(-50);
    
    // Find active scenario
    const scenarioLog = [...recentLogs].reverse().find(l => 
      l.meta?.type === 'SCENARIO_TRIGGER'
    );

    if (!scenarioLog) {
      setActiveScenario(null);
      return;
    }

    const scenarioName = scenarioLog.meta?.scenario || 'Unknown';
    const scenarioTime = new Date(scenarioLog.timestamp).getTime();
    const now = Date.now();
    const elapsed = (now - scenarioTime) / 1000; // seconds

    // If scenario is older than 3 minutes, it's probably complete
    if (elapsed > 180) {
      setActiveScenario(null);
      return;
    }

    setActiveScenario(scenarioName);

    // Define scenario stages
    const stageDefinitions = {
      dengue: [
        { name: 'Lab Detection', icon: '🔬', keywords: ['outbreak', 'detected', 'lab'] },
        { name: 'Hospital Alert', icon: '🏥', keywords: ['alert', 'hospital', 'preparing'] },
        { name: 'Bed Preparation', icon: '🛏️', keywords: ['bed', 'reserved', 'isolation'] },
        { name: 'Medicine Request', icon: '💊', keywords: ['medicine', 'request', 'pharmacy'] },
        { name: 'Supply Confirmation', icon: '📦', keywords: ['order', 'confirmed', 'supplier'] },
      ],
      malaria: [
        { name: 'Lab Detection', icon: '🔬', keywords: ['outbreak', 'malaria'] },
        { name: 'Hospital Response', icon: '🏥', keywords: ['hospital', 'preparing'] },
        { name: 'Resource Allocation', icon: '💊', keywords: ['medicine', 'bed'] },
        { name: 'Supply Chain', icon: '📦', keywords: ['supplier', 'order'] },
      ],
      covid: [
        { name: 'Lab Detection', icon: '🔬', keywords: ['covid', 'surge'] },
        { name: 'ICU Preparation', icon: '🏥', keywords: ['icu', 'isolation'] },
        { name: 'Equipment Check', icon: '🔧', keywords: ['ventilator', 'equipment'] },
        { name: 'Medicine Stockpile', icon: '💊', keywords: ['medicine', 'antibiotic'] },
        { name: 'Delivery Confirmed', icon: '📦', keywords: ['confirmed', 'delivery'] },
      ],
      default: [
        { name: 'Detection', icon: '🔍', keywords: ['detected', 'alert'] },
        { name: 'Response', icon: '⚡', keywords: ['preparing', 'responding'] },
        { name: 'Coordination', icon: '📡', keywords: ['coordinating', 'order'] },
        { name: 'Resolution', icon: '✅', keywords: ['confirmed', 'complete'] },
      ]
    };

    const stageList = stageDefinitions[scenarioName] || stageDefinitions.default;
    
    // Check which stages are complete
    const completedStages = stageList.map((stage, idx) => {
      const isComplete = recentLogs.some(log => {
        const msg = log.message?.toLowerCase() || '';
        return stage.keywords.some(keyword => msg.includes(keyword));
      });
      return { ...stage, completed: isComplete, index: idx };
    });

    setStages(completedStages);

    // Calculate progress
    const completedCount = completedStages.filter(s => s.completed).length;
    const progressPercent = Math.min(100, Math.round((completedCount / stageList.length) * 100));
    setProgress(progressPercent);

  }, [logs]);

  if (!activeScenario) return null;

  return (
    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-2 border-purple-500 rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-purple-300 flex items-center gap-2">
            🎮 Active Scenario: {activeScenario.charAt(0).toUpperCase() + activeScenario.slice(1)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">AI agents coordinating response in real-time</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-purple-300">{progress}%</p>
          <p className="text-[10px] text-slate-400">Complete</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full transition-all duration-500 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Stage Indicators */}
      <div className="grid grid-cols-5 gap-3">
        {stages.map((stage, idx) => (
          <div key={idx} className="text-center">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 border-2 transition-all duration-300 ${
              stage.completed 
                ? 'bg-gradient-to-br from-green-600 to-emerald-600 border-green-400 shadow-lg shadow-green-500/50' 
                : 'bg-slate-700 border-slate-600'
            }`}>
              <span className="text-2xl">{stage.completed ? '✅' : stage.icon}</span>
            </div>
            <p className={`text-[10px] font-semibold ${stage.completed ? 'text-green-300' : 'text-slate-400'}`}>
              {stage.name}
            </p>
          </div>
        ))}
      </div>

      {/* Status Message */}
      {progress === 100 ? (
        <div className="mt-4 bg-green-900/30 border border-green-600 rounded p-3 text-center">
          <p className="text-sm text-green-300 font-bold">
            ✅ Scenario Complete - All agents coordinated successfully!
          </p>
        </div>
      ) : (
        <div className="mt-4 bg-yellow-900/30 border border-yellow-600 rounded p-3 text-center">
          <p className="text-sm text-yellow-300 font-bold flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            Coordination in progress - Watch agents respond...
          </p>
        </div>
      )}
    </div>
  );
}

export default ScenarioProgress;

