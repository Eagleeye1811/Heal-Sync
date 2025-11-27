// frontend/src/pages/LabDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';

function LabDashboard() {
  const { labId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [labData, setLabData] = useState(null);
  const [logs, setLogs] = useState([]);

  // Fetch lab data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/state');
        const data = await res.json();
        const lab = data.labs?.[labId];
        if (lab) {
          setLabData({ ...lab, id: labId });
        }
      } catch (err) {
        console.error('Error fetching lab data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [labId]);

  // WebSocket for agent logs
  useEffect(() => {
    const socket = io('http://localhost:4000');
    
    socket.on('agent-log', (entry) => {
      // Filter logs relevant to this lab
      if (entry.meta?.agent === 'Lab' && entry.meta?.entityId === labId) {
        setLogs(prev => [...prev, entry].slice(-50));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [labId]);

  if (!labData) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔬</div>
          <p className="text-xl">Loading laboratory data...</p>
        </div>
      </div>
    );
  }

  const getRiskLevel = (positiveRate) => {
    if (positiveRate >= 15) return { color: 'text-red-400', bg: 'bg-red-600', text: 'Critical' };
    if (positiveRate >= 10) return { color: 'text-orange-400', bg: 'bg-orange-600', text: 'High' };
    if (positiveRate >= 5) return { color: 'text-yellow-400', bg: 'bg-yellow-600', text: 'Medium' };
    return { color: 'text-green-400', bg: 'bg-green-600', text: 'Low' };
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return '📈';
    if (trend < 0) return '📉';
    return '➡️';
  };

  const getCapacityColor = (percent) => {
    if (percent >= 85) return 'text-red-400';
    if (percent >= 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-3xl">🔬</span>
                {labData.name}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {labData.type} • {labData.zone} • ID: {labData.id}
              </p>
              {user && (
                <p className="text-xs text-blue-400 mt-1">
                  👤 {user.entityName}
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
      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Test Data */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Overview */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Daily Capacity</p>
                <p className="text-2xl font-bold text-blue-400">
                  {labData.capacity?.daily || 0}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Tests Today</p>
                <p className="text-2xl font-bold text-green-400">
                  {labData.testData 
                    ? Object.values(labData.testData).reduce((sum, d) => sum + (d.today || 0), 0)
                    : 0}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Avg TAT</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {labData.turnaroundTime?.average || 0}h
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-green-700">
                <p className="text-xs text-slate-400 mb-1">Status</p>
                <p className="text-xl font-bold text-green-400">✓ Active</p>
              </div>
            </div>

            {/* Disease Testing Overview */}
            {labData.testData && (
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  🦠 Disease Testing Overview
                </h2>
                <div className="space-y-4">
                  {Object.entries(labData.testData).map(([disease, data]) => {
                    const positiveRate = data.today > 0 
                      ? ((data.positive || 0) / data.today * 100).toFixed(1)
                      : 0;
                    const risk = getRiskLevel(parseFloat(positiveRate));
                    const trend = (data.history && data.history.length >= 2)
                      ? data.history[data.history.length - 1] - data.history[data.history.length - 2]
                      : 0;

                    return (
                      <div
                        key={disease}
                        className="bg-slate-700/50 rounded-lg p-5 border border-slate-600"
                      >
                        {/* Disease Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold capitalize text-slate-200">
                              {disease}
                            </h3>
                            <p className="text-xs text-slate-400">Today's Results</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getTrendIcon(trend)}</span>
                            <span className={`px-3 py-1 rounded text-xs font-bold ${risk.bg} text-white`}>
                              {risk.text} Risk
                            </span>
                          </div>
                        </div>

                        {/* Statistics Grid */}
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Tests Today</p>
                            <p className="text-2xl font-bold text-blue-400">{data.today || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Positive</p>
                            <p className="text-2xl font-bold text-red-400">{data.positive || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Negative</p>
                            <p className="text-2xl font-bold text-green-400">{data.negative || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Positive Rate</p>
                            <p className={`text-2xl font-bold ${risk.color}`}>{positiveRate}%</p>
                          </div>
                        </div>

                        {/* Trend History */}
                        {data.history && data.history.length > 0 && (
                          <div className="pt-4 border-t border-slate-600">
                            <p className="text-xs text-slate-400 mb-2">7-Day Trend</p>
                            <div className="flex items-end gap-1 h-16">
                              {data.history.slice(-7).map((count, idx) => {
                                const maxHeight = Math.max(...data.history.slice(-7));
                                const heightPercent = maxHeight > 0 ? (count / maxHeight) * 100 : 0;
                                
                                return (
                                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                      className={`w-full ${risk.bg} rounded-t transition-all`}
                                      style={{ height: `${heightPercent}%` }}
                                      title={`${count} tests`}
                                    ></div>
                                    <span className="text-[10px] text-slate-500">D{idx + 1}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Alert if high positive rate */}
                        {parseFloat(positiveRate) >= 10 && (
                          <div className="mt-4 bg-red-900/30 border border-red-700 rounded p-3">
                            <p className="text-xs text-red-300 flex items-center gap-2">
                              ⚠️ High positive rate detected. AI Agent broadcasting outbreak alert to hospitals.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lab Capacity */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                📊 Testing Capacity
              </h2>
              <div className="space-y-4">
                {labData.capacity && (
                  <>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-slate-300">Daily Capacity</span>
                        <span className="text-xl font-bold text-blue-400">
                          {labData.capacity.daily} tests/day
                        </span>
                      </div>
                      {labData.testData && (
                        <>
                          <div className="w-full bg-slate-600 rounded-full h-3 mb-2">
                            <div
                              className={`${
                                ((Object.values(labData.testData).reduce((sum, d) => sum + (d.today || 0), 0) / 
                                  labData.capacity.daily) * 100) >= 85
                                  ? 'bg-red-600'
                                  : 'bg-green-600'
                              } h-3 rounded-full transition-all`}
                              style={{ 
                                width: `${Math.min(
                                  (Object.values(labData.testData).reduce((sum, d) => sum + (d.today || 0), 0) / 
                                    labData.capacity.daily) * 100, 
                                  100
                                )}%` 
                              }}
                            ></div>
                          </div>
                          <p className={`text-sm ${getCapacityColor(
                            (Object.values(labData.testData).reduce((sum, d) => sum + (d.today || 0), 0) / 
                              labData.capacity.daily) * 100
                          )}`}>
                            {((Object.values(labData.testData).reduce((sum, d) => sum + (d.today || 0), 0) / 
                              labData.capacity.daily) * 100).toFixed(1)}% utilized today
                          </p>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <p className="text-xs text-slate-400 mb-1">Current Backlog</p>
                        <p className="text-2xl font-bold text-yellow-400">
                          {labData.capacity.backlog || 0}
                        </p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <p className="text-xs text-slate-400 mb-1">Peak Hours</p>
                        <p className="text-lg font-bold text-blue-400">
                          {labData.capacity.peakHours || '9AM-12PM'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Info & Logs */}
          <div className="space-y-6">
            {/* Lab Info */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4">ℹ️ Lab Information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Zone:</span>
                  <span className="font-semibold text-blue-400">{labData.zone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="font-semibold text-green-400">{labData.type}</span>
                </div>
                {labData.turnaroundTime && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg TAT:</span>
                      <span className="font-semibold text-yellow-400">
                        {labData.turnaroundTime.average}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Express TAT:</span>
                      <span className="font-semibold text-green-400">
                        {labData.turnaroundTime.express}h
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Outbreak Detection */}
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <h3 className="font-bold text-red-300 mb-2 flex items-center gap-2">
                🚨 Outbreak Detection
              </h3>
              <p className="text-sm text-slate-300 mb-3">
                AI Agent continuously monitors test patterns to predict outbreaks before they escalate.
              </p>
              <div className="bg-slate-800/50 rounded p-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Alert Threshold:</span>
                  <span className="text-red-400 font-semibold">10% positive rate</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Response Time:</span>
                  <span className="text-green-400 font-semibold">&lt; 5 minutes</span>
                </div>
              </div>
            </div>

            {/* AI Agent Activity */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4">🤖 AI Agent Activity</h2>
              <div className="bg-green-900/20 border border-green-700 rounded p-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="text-sm text-green-300 font-semibold">Lab Agent Active</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Analyzing test data and predicting disease outbreaks
                </p>
              </div>

              {/* Recent Logs */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No recent activity
                  </p>
                ) : (
                  logs.slice(-10).reverse().map((log, i) => (
                    <div key={i} className="bg-slate-700/50 rounded p-3 text-sm">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-200">{log.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LabDashboard;

