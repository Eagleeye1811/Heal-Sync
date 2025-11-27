// frontend/src/pages/HospitalDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';

function HospitalDashboard() {
  const { hospitalId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hospitalData, setHospitalData] = useState(null);
  const [logs, setLogs] = useState([]);

  // Fetch hospital data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/state');
        const data = await res.json();
        const hospital = data.hospitals?.[hospitalId];
        if (hospital) {
          setHospitalData({ ...hospital, id: hospitalId });
        }
      } catch (err) {
        console.error('Error fetching hospital data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [hospitalId]);

  // WebSocket for agent logs
  useEffect(() => {
    const socket = io('http://localhost:4000');
    
    socket.on('agent-log', (entry) => {
      // Filter logs relevant to this hospital
      if (entry.meta?.agent === 'Hospital' && entry.meta?.entityId === hospitalId) {
        setLogs(prev => [...prev, entry].slice(-50));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [hospitalId]);

  if (!hospitalData) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏥</div>
          <p className="text-xl">Loading hospital data...</p>
        </div>
      </div>
    );
  }

  const getBedUtilization = (bedType) => {
    const bed = hospitalData.beds[bedType];
    return Math.round((bed.occupied / bed.total) * 100);
  };

  const getUtilizationColor = (percent) => {
    if (percent >= 85) return 'text-red-400';
    if (percent >= 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getUtilizationBg = (percent) => {
    if (percent >= 85) return 'bg-red-600';
    if (percent >= 70) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-3xl">🏥</span>
                {hospitalData.name}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {hospitalData.type} • {hospitalData.zone} • ID: {hospitalData.id}
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
          {/* Left Column - Bed Capacity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bed Capacity Overview */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                🛏️ Bed Capacity Status
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(hospitalData.beds).map(([bedType, bedData]) => {
                  const utilization = getBedUtilization(bedType);
                  const available = bedData.total - bedData.occupied;
                  
                  return (
                    <div
                      key={bedType}
                      className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold capitalize text-slate-200">
                            {bedType.replace(/([A-Z])/g, ' $1').trim()}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {available} available of {bedData.total} total
                          </p>
                        </div>
                        <div className={`text-2xl font-bold ${getUtilizationColor(utilization)}`}>
                          {available}
                        </div>
                      </div>
                      
                      {/* Utilization Bar */}
                      <div className="mb-2">
                        <div className="w-full bg-slate-600 rounded-full h-3">
                          <div
                            className={`${getUtilizationBg(utilization)} h-3 rounded-full transition-all`}
                            style={{ width: `${utilization}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">{utilization}% occupied</p>
                    </div>
                  );
                })}
              </div>

              {/* Overall Summary */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-400">
                      {Object.values(hospitalData.beds).reduce((sum, b) => sum + b.total, 0)}
                    </p>
                    <p className="text-xs text-slate-400">Total Beds</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">
                      {Object.values(hospitalData.beds).reduce((sum, b) => sum + (b.total - b.occupied), 0)}
                    </p>
                    <p className="text-xs text-slate-400">Available</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-400">
                      {Object.values(hospitalData.beds).reduce((sum, b) => sum + b.occupied, 0)}
                    </p>
                    <p className="text-xs text-slate-400">Occupied</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Metrics */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                📊 Patient Metrics
              </h2>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">Daily Admissions</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {hospitalData.patientMetrics?.admissionsToday || 0}
                  </p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">Discharges Today</p>
                  <p className="text-2xl font-bold text-green-400">
                    {hospitalData.patientMetrics?.dischargesToday || 0}
                  </p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">ER Waiting</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {hospitalData.patientMetrics?.erWaitingTime || 0} min
                  </p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">Critical Cases</p>
                  <p className="text-2xl font-bold text-red-400">
                    {hospitalData.patientMetrics?.criticalCases || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Equipment Status */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                🔧 Equipment Status
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {hospitalData.equipment && Object.entries(hospitalData.equipment).map(([equip, data]) => (
                  <div key={equip} className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="font-semibold capitalize mb-2 text-slate-200">
                      {equip.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-2xl font-bold text-blue-400">{data.available}</p>
                        <p className="text-xs text-slate-400">available</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">of {data.total}</p>
                        {data.inUse !== undefined && (
                          <p className="text-xs text-yellow-400">{data.inUse} in use</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disease Preparation */}
            {hospitalData.diseasePrep && Object.keys(hospitalData.diseasePrep).length > 0 && (
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  🦠 Disease Preparation Status
                </h2>
                <div className="space-y-3">
                  {Object.entries(hospitalData.diseasePrep).map(([disease, prep]) => (
                    <div key={disease} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold capitalize">{disease}</h3>
                        <span className={`px-3 py-1 rounded text-xs font-bold ${
                          prep.readiness === 'high' 
                            ? 'bg-green-600 text-white'
                            : prep.readiness === 'medium'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-red-600 text-white'
                        }`}>
                          {prep.readiness?.toUpperCase()} READINESS
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-slate-400">Beds Reserved</p>
                          <p className="font-semibold">{prep.bedsReserved || 0}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Medicine Stock</p>
                          <p className="font-semibold">{prep.medicineStock || 0} units</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Staff Trained</p>
                          <p className="font-semibold">{prep.staffTrained || 0}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Logs & Alerts */}
          <div className="space-y-6">
            {/* Staff Overview */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4">👥 Staff on Duty</h2>
              <div className="space-y-3">
                {hospitalData.staff && Object.entries(hospitalData.staff).map(([role, data]) => (
                  <div key={role} className="flex justify-between items-center">
                    <span className="capitalize text-slate-300">{role}</span>
                    <span className="font-semibold text-blue-400">
                      {data.onDuty} / {data.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Agent Activity */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4">🤖 AI Agent Activity</h2>
              <div className="bg-green-900/20 border border-green-700 rounded p-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="text-sm text-green-300 font-semibold">Hospital Agent Active</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Monitoring capacity and coordinating with other facilities
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

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700 rounded-lg p-6">
              <h3 className="font-bold mb-3">📈 Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">Overall Capacity:</span>
                  <span className={`font-semibold ${
                    getBedUtilization('general') >= 85 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {Math.round(
                      (Object.values(hospitalData.beds).reduce((sum, b) => sum + b.occupied, 0) /
                       Object.values(hospitalData.beds).reduce((sum, b) => sum + b.total, 0)) * 100
                    )}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Zone:</span>
                  <span className="text-blue-400 font-semibold">{hospitalData.zone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Type:</span>
                  <span className="text-blue-400 font-semibold">{hospitalData.type}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HospitalDashboard;

