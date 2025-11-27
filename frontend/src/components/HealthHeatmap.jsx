// frontend/src/components/HealthHeatmap.jsx
import { useState } from 'react';

function HealthHeatmap({ cityData }) {
  const [selectedZone, setSelectedZone] = useState(null);

  if (!cityData || !cityData.city) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">🗺️ Zone Health Status Map</h3>
        <div className="text-center text-slate-400 py-8">Loading map data...</div>
      </div>
    );
  }

  const { zones, riskZones } = cityData.city;

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
      case 'critical':
        return {
          bg: 'bg-red-900/30',
          border: 'border-red-600',
          text: 'text-red-400',
          emoji: '🔴',
          glow: 'shadow-red-500/50'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-900/30',
          border: 'border-yellow-600',
          text: 'text-yellow-400',
          emoji: '🟡',
          glow: 'shadow-yellow-500/50'
        };
      default:
        return {
          bg: 'bg-green-900/30',
          border: 'border-green-600',
          text: 'text-green-400',
          emoji: '🟢',
          glow: 'shadow-green-500/50'
        };
    }
  };

  const getDiseaseRisks = (zoneId) => {
    const risks = riskZones[zoneId];
    if (!risks) return [];
    
    return Object.entries(risks)
      .filter(([key, value]) => 
        key !== 'overall' && 
        key !== 'airQuality' && 
        key !== 'waterborne' && 
        (value === 'high' || value === 'critical' || value === 'medium')
      )
      .map(([disease, level]) => ({ disease, level }));
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 mb-8">
      <h3 className="text-2xl font-bold mb-6">🗺️ Zone Health Status Map</h3>
      
      {/* Zone Cards Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {zones && Object.entries(zones).map(([zoneId, zone]) => {
          const riskData = riskZones[zoneId];
          const overallRisk = riskData?.overall || 'low';
          const colors = getRiskColor(overallRisk);
          const diseaseRisks = getDiseaseRisks(zoneId);
          const isSelected = selectedZone === zoneId;

          return (
            <div
              key={zoneId}
              onClick={() => setSelectedZone(isSelected ? null : zoneId)}
              className={`
                ${colors.bg} border-2 ${colors.border} rounded-lg p-6 cursor-pointer
                transition-all duration-300 hover:scale-105 hover:shadow-xl ${colors.glow}
                ${isSelected ? 'ring-4 ring-blue-500/50' : ''}
              `}
            >
              {/* Risk Indicator */}
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">{colors.emoji}</div>
                <div className={`text-lg font-bold ${colors.text}`}>
                  {overallRisk.toUpperCase()} RISK
                </div>
              </div>

              {/* Zone Info */}
              <div className="border-t border-slate-700 pt-4">
                <h4 className="font-bold text-lg mb-1">{zone.name}</h4>
                <div className="text-sm text-slate-400 space-y-1">
                  <p>📍 {zoneId}</p>
                  <p>👥 Population: {zone.population.toLocaleString()}</p>
                  <p>📏 Area: {zone.area}</p>
                  <p>🏥 Hospitals: {zone.hospitals.length}</p>
                </div>
              </div>

              {/* Active Disease Risks */}
              {diseaseRisks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="text-xs font-semibold text-slate-400 mb-2">
                    Active Risks:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {diseaseRisks.map(({ disease, level }) => (
                      <span
                        key={disease}
                        className={`
                          px-2 py-1 rounded text-xs font-medium
                          ${level === 'high' || level === 'critical'
                            ? 'bg-red-600/30 text-red-300'
                            : 'bg-yellow-600/30 text-yellow-300'
                          }
                        `}
                      >
                        {disease}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Click to expand hint */}
              <div className="mt-4 text-center text-xs text-slate-500">
                {isSelected ? '▼ Click to collapse' : '▶ Click for details'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Zone Details */}
      {selectedZone && zones[selectedZone] && (
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 animate-fadeIn">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-xl font-bold">
              📍 {zones[selectedZone].name} - Detailed Information
            </h4>
            <button
              onClick={() => setSelectedZone(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕ Close
            </button>
          </div>

          {/* Disease Risk Breakdown */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <h5 className="font-semibold mb-3 text-slate-300">Disease Risk Levels</h5>
              <div className="space-y-2">
                {riskZones[selectedZone] && Object.entries(riskZones[selectedZone])
                  .filter(([key]) => 
                    key !== 'overall' && 
                    key !== 'airQuality' && 
                    key !== 'waterborne' &&
                    key !== 'heatwave'
                  )
                  .map(([disease, level]) => (
                    <div key={disease} className="flex justify-between items-center bg-slate-800 p-2 rounded">
                      <span className="capitalize">{disease}</span>
                      <span className={`
                        px-2 py-1 rounded text-xs font-bold
                        ${level === 'high' || level === 'critical'
                          ? 'bg-red-600 text-white'
                          : level === 'medium'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-green-600 text-white'
                        }
                      `}>
                        {level?.toUpperCase()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h5 className="font-semibold mb-3 text-slate-300">Environmental Factors</h5>
              <div className="space-y-2">
                {riskZones[selectedZone]?.heatwave && (
                  <div className="flex justify-between items-center bg-slate-800 p-2 rounded">
                    <span>🌡️ Heatwave</span>
                    <span className={`text-xs ${
                      riskZones[selectedZone].heatwave === 'high' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {riskZones[selectedZone].heatwave.toUpperCase()}
                    </span>
                  </div>
                )}
                {riskZones[selectedZone]?.airQuality && (
                  <div className="flex justify-between items-center bg-slate-800 p-2 rounded">
                    <span>💨 Air Quality</span>
                    <span className="text-xs text-slate-400">
                      {riskZones[selectedZone].airQuality.toUpperCase()}
                    </span>
                  </div>
                )}
                {riskZones[selectedZone]?.waterborne && (
                  <div className="flex justify-between items-center bg-slate-800 p-2 rounded">
                    <span>💧 Waterborne</span>
                    <span className={`text-xs ${
                      riskZones[selectedZone].waterborne === 'high' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {riskZones[selectedZone].waterborne.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Facilities in Zone */}
          <div className="border-t border-slate-700 pt-4">
            <h5 className="font-semibold mb-3 text-slate-300">Healthcare Facilities</h5>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-400 mb-2">🏥 Hospitals</p>
                <div className="space-y-1">
                  {zones[selectedZone].hospitals.map(hId => {
                    const hospital = cityData.hospitals?.[hId];
                    if (!hospital) return null;
                    return (
                      <div key={hId} className="text-slate-300">
                        • {hospital.name}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-slate-400 mb-2">🔬 Labs</p>
                <div className="space-y-1">
                  {zones[selectedZone].labs.length > 0 ? (
                    zones[selectedZone].labs.map(lId => {
                      const lab = cityData.labs?.[lId];
                      if (!lab) return null;
                      return (
                        <div key={lId} className="text-slate-300">
                          • {lab.name}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-slate-500 italic">None in zone</div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-slate-400 mb-2">💊 Pharmacies</p>
                <div className="space-y-1">
                  {zones[selectedZone].pharmacies.map(pId => {
                    const pharmacy = cityData.pharmacies?.[pId];
                    if (!pharmacy) return null;
                    return (
                      <div key={pId} className="text-slate-300">
                        • {pharmacy.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {getDiseaseRisks(selectedZone).length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <h5 className="font-semibold mb-3 text-slate-300">🛡️ Health Advisory</h5>
              <div className="bg-blue-900/20 border border-blue-700 rounded p-4">
                <ul className="text-sm space-y-2">
                  {getDiseaseRisks(selectedZone).some(r => r.disease === 'dengue') && (
                    <li>• Remove stagnant water around your home</li>
                  )}
                  {getDiseaseRisks(selectedZone).some(r => r.disease === 'dengue' || r.disease === 'malaria') && (
                    <li>• Use mosquito repellent, especially during evening</li>
                  )}
                  {riskZones[selectedZone]?.heatwave === 'high' && (
                    <li>• Stay hydrated and avoid direct sun between 12-3 PM</li>
                  )}
                  {riskZones[selectedZone]?.waterborne === 'high' && (
                    <li>• Drink only boiled or purified water</li>
                  )}
                  <li>• Seek medical attention immediately if you experience symptoms</li>
                  <li>• Healthcare facilities in this zone are prepared and ready</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map Legend */}
      <div className="flex justify-center gap-6 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🟢</span>
          <span className="text-slate-400">Low Risk - Normal operations</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🟡</span>
          <span className="text-slate-400">Medium Risk - Monitoring closely</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔴</span>
          <span className="text-slate-400">High Risk - Outbreak response active</span>
        </div>
      </div>
    </div>
  );
}

export default HealthHeatmap;

