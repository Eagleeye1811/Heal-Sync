// frontend/src/components/CityStatistics.jsx
function CityStatistics({ cityData }) {
  if (!cityData || !cityData.city) {
    return null;
  }

  const { totalResources, diseaseStats, agentMetrics } = cityData.city;

  // Calculate utilization percentages
  const bedUtilization = totalResources?.beds 
    ? Math.round(((totalResources.beds.total - totalResources.beds.available) / totalResources.beds.total) * 100)
    : 0;

  const ambulanceUtilization = totalResources?.ambulances
    ? Math.round(((totalResources.ambulances.total - totalResources.ambulances.available) / totalResources.ambulances.total) * 100)
    : 0;

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

  // Calculate total active cases
  const totalActiveCases = diseaseStats 
    ? Object.values(diseaseStats).reduce((sum, disease) => sum + (disease.activeCases || 0), 0)
    : 0;

  const totalNewToday = diseaseStats
    ? Object.values(diseaseStats).reduce((sum, disease) => sum + (disease.newToday || 0), 0)
    : 0;

  return (
    <div className="space-y-8">
      {/* Resource Availability */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-6">🏥 Citywide Resource Availability</h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Beds */}
          <div className="bg-slate-700/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">🛏️</span>
              <span className={`text-2xl font-bold ${getUtilizationColor(bedUtilization)}`}>
                {totalResources?.beds?.available || 0}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-300 mb-1">Hospital Beds</h4>
            <p className="text-xs text-slate-400 mb-3">
              {totalResources?.beds?.available || 0} available of {totalResources?.beds?.total || 0} total
            </p>
            
            {/* Utilization Bar */}
            <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
              <div
                className={`${getUtilizationBg(bedUtilization)} h-2 rounded-full transition-all`}
                style={{ width: `${bedUtilization}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400">{bedUtilization}% utilized</p>
          </div>

          {/* Ambulances */}
          <div className="bg-slate-700/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">🚑</span>
              <span className={`text-2xl font-bold ${getUtilizationColor(ambulanceUtilization)}`}>
                {totalResources?.ambulances?.available || 0}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-300 mb-1">Ambulances</h4>
            <p className="text-xs text-slate-400 mb-3">
              {totalResources?.ambulances?.available || 0} ready of {totalResources?.ambulances?.total || 0} total
            </p>
            
            {/* Utilization Bar */}
            <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
              <div
                className={`${getUtilizationBg(ambulanceUtilization)} h-2 rounded-full transition-all`}
                style={{ width: `${ambulanceUtilization}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400">{ambulanceUtilization}% deployed</p>
          </div>

          {/* Medical Staff */}
          <div className="bg-slate-700/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">👨‍⚕️</span>
              <span className="text-2xl font-bold text-blue-400">
                {totalResources?.doctors?.onDuty || 0}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-300 mb-1">Medical Staff</h4>
            <p className="text-xs text-slate-400 mb-3">
              Doctors currently on duty
            </p>
            <div className="text-xs space-y-1">
              <p className="text-slate-400">
                👩‍⚕️ Nurses: {totalResources?.nurses?.onDuty || 0}
              </p>
              <p className="text-slate-400">
                🔬 Lab Staff: {totalResources?.labTechs?.onDuty || 0}
              </p>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-slate-700/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">⚠️</span>
              <span className={`text-2xl font-bold ${
                cityData.city.activeAlerts?.length > 0 ? 'text-red-400' : 'text-green-400'
              }`}>
                {cityData.city.activeAlerts?.length || 0}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-300 mb-1">Active Alerts</h4>
            <p className="text-xs text-slate-400 mb-3">
              Current health advisories
            </p>
            {cityData.city.activeAlerts?.length > 0 ? (
              <p className="text-xs text-yellow-400">⚡ Response in progress</p>
            ) : (
              <p className="text-xs text-green-400">✓ All systems normal</p>
            )}
          </div>
        </div>
      </div>

      {/* Disease Surveillance */}
      {diseaseStats && Object.keys(diseaseStats).length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">🦠 Disease Surveillance</h3>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-400">{totalActiveCases}</p>
              <p className="text-xs text-slate-400">Total Active Cases</p>
            </div>
          </div>

          <div className="grid md:grid-cols-5 gap-4 mb-4">
            {Object.entries(diseaseStats).map(([disease, stats]) => (
              <div key={disease} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <h4 className="font-semibold capitalize mb-2 text-slate-200">{disease}</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-2xl font-bold text-red-400">{stats.activeCases}</p>
                    <p className="text-xs text-slate-400">active cases</p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-400">+{stats.newToday} today</span>
                    {stats.trend && (
                      <span className={stats.trend === 'rising' ? 'text-red-400' : 'text-green-400'}>
                        {stats.trend === 'rising' ? '📈' : '📉'}
                      </span>
                    )}
                  </div>
                  {stats.recoveredTotal && (
                    <p className="text-xs text-slate-500">
                      {stats.recoveredTotal} recovered
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Today's Summary */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📊</span>
              <h4 className="font-semibold">Today's Summary</h4>
            </div>
            <p className="text-sm text-slate-300">
              <span className="font-bold text-yellow-400">{totalNewToday}</span> new cases reported today 
              across all diseases. AI agents are monitoring trends and coordinating responses in real-time.
            </p>
          </div>
        </div>
      )}

      {/* AI Agent Activity */}
      {agentMetrics && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-6">🤖 AI Agent Activity</h3>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700 rounded-lg p-4">
              <div className="text-3xl mb-2">🔬</div>
              <p className="text-2xl font-bold text-green-400">{agentMetrics.labAgents || 2}</p>
              <p className="text-sm text-slate-300">Lab Agents</p>
              <p className="text-xs text-slate-400 mt-2">Monitoring test data</p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700 rounded-lg p-4">
              <div className="text-3xl mb-2">🏥</div>
              <p className="text-2xl font-bold text-blue-400">{agentMetrics.hospitalAgents || 4}</p>
              <p className="text-sm text-slate-300">Hospital Agents</p>
              <p className="text-xs text-slate-400 mt-2">Managing capacity</p>
            </div>

            <div className="bg-gradient-to-br from-teal-900/30 to-teal-800/20 border border-teal-700 rounded-lg p-4">
              <div className="text-3xl mb-2">💊</div>
              <p className="text-2xl font-bold text-teal-400">{agentMetrics.pharmacyAgents || 3}</p>
              <p className="text-sm text-slate-300">Pharmacy Agents</p>
              <p className="text-xs text-slate-400 mt-2">Tracking inventory</p>
            </div>

            <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 border border-orange-700 rounded-lg p-4">
              <div className="text-3xl mb-2">📦</div>
              <p className="text-2xl font-bold text-orange-400">{agentMetrics.supplierAgents || 2}</p>
              <p className="text-sm text-slate-300">Supplier Agents</p>
              <p className="text-xs text-slate-400 mt-2">Coordinating supply</p>
            </div>
          </div>

          <div className="mt-4 bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
              <p className="text-sm text-slate-300">
                <span className="font-semibold">System Status:</span> All agents operational. 
                {agentMetrics.actionsToday && (
                  <span className="ml-2">
                    <span className="text-blue-400 font-bold">{agentMetrics.actionsToday}</span> coordinated 
                    actions taken today.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CityStatistics;

