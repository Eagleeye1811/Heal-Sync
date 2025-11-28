// frontend/src/pages/PublicDashboard.jsx
import { useEffect, useState } from "react";
import HealthHeatmap from "../components/HealthHeatmap";
import ActiveAlerts from "../components/ActiveAlerts";
import CityStatistics from "../components/CityStatistics";
import LoginModal from "../components/LoginModal";

function PublicDashboard() {
  const [cityData, setCityData] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const fetchCityData = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/state");
        const data = await res.json();
        setCityData(data);
      } catch (err) {
        console.error("Error fetching city data:", err);
      }
    };

    fetchCityData();
    const interval = setInterval(fetchCityData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-blue-400">🏙️</span>
              <span className="text-blue-400">Heal</span>
              <span>Sync</span>
            </h1>
            <p className="text-sm text-slate-400">Public Health Dashboard</p>
          </div>
          
          {/* Login button */}
          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            🔐 Professional Login
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Real-time Citywide Health Monitoring
          </h2>
          <p className="text-xl text-slate-300 mb-2">
            Autonomous AI agents coordinating healthcare resources across Mumbai
          </p>
          <p className="text-sm text-slate-400">
            6 Agents Active • 3 Zones Monitored • Real-time Updates
          </p>
        </div>

        {/* System Status Banner */}
        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
            <h3 className="text-lg font-semibold text-green-300">System Active</h3>
          </div>
          <p className="text-slate-300">
            All healthcare agents are operational and coordinating in real-time.
            {cityData?.city?.totalResources && (
              <span className="ml-2">
                {cityData.city.totalResources.beds.available} beds available citywide.
              </span>
            )}
          </p>
        </div>

        {/* Interactive Health Heatmap */}
        <HealthHeatmap cityData={cityData} />

        {/* Active Health Alerts */}
        <ActiveAlerts cityData={cityData} />

        {/* City Statistics */}
        <CityStatistics cityData={cityData} />

        {/* Call to Action */}
        <div className="text-center bg-slate-800 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-4">For Healthcare Professionals</h3>
          <p className="text-slate-300 mb-6">
            Access your role-specific dashboard to monitor operations, view agent actions, and coordinate resources.
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Access Professional Dashboard →
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800/50 border-t border-slate-700 mt-12">
        <div className="container mx-auto px-6 py-6 text-center text-sm text-slate-400">
          <p>© 2025 HealSync | Citywide Health Collaboration Network</p>
          <p className="mt-1">Powered by Autonomous AI Agents</p>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
}

export default PublicDashboard;

