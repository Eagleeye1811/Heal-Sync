// frontend/src/pages/PharmacyDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';

function PharmacyDashboard() {
  const { pharmacyId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pharmacyData, setPharmacyData] = useState(null);
  const [logs, setLogs] = useState([]);

  // Fetch pharmacy data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/state');
        const data = await res.json();
        const pharmacy = data.pharmacies?.[pharmacyId];
        if (pharmacy) {
          setPharmacyData({ ...pharmacy, id: pharmacyId });
        }
      } catch (err) {
        console.error('Error fetching pharmacy data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [pharmacyId]);

  // WebSocket for agent logs
  useEffect(() => {
    const socket = io('http://localhost:4000');
    
    socket.on('agent-log', (entry) => {
      // Filter logs relevant to this pharmacy
      if (entry.meta?.agent === 'Pharmacy' && entry.meta?.entityId === pharmacyId) {
        setLogs(prev => [...prev, entry].slice(-50));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [pharmacyId]);

  if (!pharmacyData) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💊</div>
          <p className="text-xl">Loading pharmacy data...</p>
        </div>
      </div>
    );
  }

  const getStockStatus = (medicine) => {
    const stockLevel = (medicine.stock / medicine.reorderPoint) * 100;
    if (stockLevel < 50) return { color: 'text-red-400', bg: 'bg-red-600', status: 'Critical' };
    if (stockLevel < 100) return { color: 'text-yellow-400', bg: 'bg-yellow-600', status: 'Low' };
    if (stockLevel < 200) return { color: 'text-green-400', bg: 'bg-green-600', status: 'Normal' };
    return { color: 'text-blue-400', bg: 'bg-blue-600', status: 'Sufficient' };
  };

  const getDaysRemaining = (medicine) => {
    if (!medicine.usagePerDay || medicine.usagePerDay === 0) return '∞';
    return Math.floor(medicine.stock / medicine.usagePerDay);
  };

  // Group medicines by category
  const medicinesByCategory = {};
  if (pharmacyData.medicines) {
    Object.entries(pharmacyData.medicines).forEach(([id, med]) => {
      const category = med.category || 'Other';
      if (!medicinesByCategory[category]) {
        medicinesByCategory[category] = [];
      }
      medicinesByCategory[category].push({ id, ...med });
    });
  }

  const lowStockMedicines = pharmacyData.medicines 
    ? Object.entries(pharmacyData.medicines)
        .filter(([_, med]) => med.stock < med.reorderPoint)
        .length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/20 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-3xl">💊</span>
                {pharmacyData.name}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {pharmacyData.type} • {pharmacyData.zone} • ID: {pharmacyData.id}
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
          {/* Left Column - Inventory */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Overview */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Total Medicines</p>
                <p className="text-2xl font-bold text-blue-400">
                  {pharmacyData.medicines ? Object.keys(pharmacyData.medicines).length : 0}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-red-700">
                <p className="text-xs text-slate-400 mb-1">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-400">{lowStockMedicines}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Pending Orders</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {pharmacyData.pendingOrders?.length || 0}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">24h Operating</p>
                <p className="text-2xl font-bold text-green-400">
                  {pharmacyData.hours24 ? '✓' : '✗'}
                </p>
              </div>
            </div>

            {/* Medicine Inventory by Category */}
            {Object.entries(medicinesByCategory).map(([category, medicines]) => (
              <div key={category} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  💊 {category}
                </h2>
                <div className="space-y-3">
                  {medicines.map(medicine => {
                    const status = getStockStatus(medicine);
                    const daysRemaining = getDaysRemaining(medicine);
                    
                    return (
                      <div
                        key={medicine.id}
                        className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-200">{medicine.name}</h3>
                            <p className="text-xs text-slate-400">{medicine.id}</p>
                          </div>
                          <span className={`px-3 py-1 rounded text-xs font-bold ${status.bg} text-white`}>
                            {status.status}
                          </span>
                        </div>

                        {/* Stock Bar */}
                        <div className="mb-3">
                          <div className="w-full bg-slate-600 rounded-full h-2">
                            <div
                              className={`${status.bg} h-2 rounded-full transition-all`}
                              style={{ width: `${Math.min((medicine.stock / (medicine.reorderPoint * 2)) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-xs">
                          <div>
                            <p className="text-slate-400">Current Stock</p>
                            <p className={`font-semibold text-lg ${status.color}`}>
                              {medicine.stock}
                            </p>
                            <p className="text-slate-500">{medicine.unit}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Reorder Point</p>
                            <p className="font-semibold text-yellow-400">{medicine.reorderPoint}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Days Remaining</p>
                            <p className="font-semibold text-slate-200">{daysRemaining}</p>
                            <p className="text-slate-500">@ {medicine.usagePerDay}/day</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Price</p>
                            <p className="font-semibold text-green-400">₹{medicine.price}</p>
                          </div>
                        </div>

                        {medicine.expiryDate && (
                          <div className="mt-2 pt-2 border-t border-slate-600">
                            <p className="text-xs text-slate-400">
                              Expires: {new Date(medicine.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {medicine.stock < medicine.reorderPoint && (
                          <div className="mt-3 bg-red-900/30 border border-red-700 rounded p-2">
                            <p className="text-xs text-red-300 flex items-center gap-2">
                              ⚠️ Below reorder point - AI Agent will place order automatically
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Pending Orders */}
            {pharmacyData.pendingOrders && pharmacyData.pendingOrders.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  📦 Pending Orders
                </h2>
                <div className="space-y-3">
                  {pharmacyData.pendingOrders.map((order, index) => (
                    <div key={index} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{order.medicine}</h3>
                          <p className="text-xs text-slate-400">Quantity: {order.quantity}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          order.status === 'confirmed' 
                            ? 'bg-blue-600 text-white'
                            : order.status === 'shipped'
                            ? 'bg-green-600 text-white'
                            : 'bg-yellow-600 text-white'
                        }`}>
                          {order.status?.toUpperCase()}
                        </span>
                      </div>
                      {order.supplier && (
                        <p className="text-xs text-slate-400">From: {order.supplier}</p>
                      )}
                      {order.eta && (
                        <p className="text-xs text-blue-400">ETA: {order.eta}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Status & Logs */}
          <div className="space-y-6">
            {/* Pharmacy Info */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4">ℹ️ Pharmacy Info</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Zone:</span>
                  <span className="font-semibold text-blue-400">{pharmacyData.zone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="font-semibold text-teal-400">{pharmacyData.type}</span>
                </div>
                {pharmacyData.hours24 !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hours:</span>
                    <span className="font-semibold text-green-400">
                      {pharmacyData.hours24 ? '24/7' : 'Regular'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stock Alerts */}
            {lowStockMedicines > 0 && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <h3 className="font-bold text-red-300 mb-2 flex items-center gap-2">
                  ⚠️ Stock Alerts
                </h3>
                <p className="text-sm text-slate-300 mb-3">
                  {lowStockMedicines} medicine{lowStockMedicines > 1 ? 's' : ''} below reorder point
                </p>
                <div className="text-xs text-slate-400">
                  AI Pharmacy Agent is monitoring inventory and will automatically place orders when needed.
                </div>
              </div>
            )}

            {/* AI Agent Activity */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4">🤖 AI Agent Activity</h2>
              <div className="bg-green-900/20 border border-green-700 rounded p-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="text-sm text-green-300 font-semibold">Pharmacy Agent Active</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Monitoring stock levels and coordinating with suppliers
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

export default PharmacyDashboard;

