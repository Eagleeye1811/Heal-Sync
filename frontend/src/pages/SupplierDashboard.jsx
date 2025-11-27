// frontend/src/pages/SupplierDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';

function SupplierDashboard() {
  const { supplierId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [supplierData, setSupplierData] = useState(null);
  const [logs, setLogs] = useState([]);

  // Fetch supplier data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/state');
        const data = await res.json();
        const supplier = data.suppliers?.[supplierId];
        if (supplier) {
          setSupplierData({ ...supplier, id: supplierId });
        }
      } catch (err) {
        console.error('Error fetching supplier data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [supplierId]);

  // WebSocket for agent logs
  useEffect(() => {
    const socket = io('http://localhost:4000');
    
    socket.on('agent-log', (entry) => {
      // Filter logs relevant to this supplier
      if (entry.meta?.agent === 'Supplier' && entry.meta?.entityId === supplierId) {
        setLogs(prev => [...prev, entry].slice(-50));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [supplierId]);

  if (!supplierData) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-xl">Loading supplier data...</p>
        </div>
      </div>
    );
  }

  const getStockLevel = (item) => {
    const level = (item.stock / item.capacity) * 100;
    if (level < 20) return { color: 'text-red-400', bg: 'bg-red-600', text: 'Low' };
    if (level < 50) return { color: 'text-yellow-400', bg: 'bg-yellow-600', text: 'Medium' };
    return { color: 'text-green-400', bg: 'bg-green-600', text: 'Good' };
  };

  const getVehicleStatus = (status) => {
    switch (status) {
      case 'available':
        return { color: 'text-green-400', badge: 'bg-green-600 text-white' };
      case 'in-transit':
        return { color: 'text-blue-400', badge: 'bg-blue-600 text-white' };
      case 'maintenance':
        return { color: 'text-yellow-400', badge: 'bg-yellow-600 text-white' };
      default:
        return { color: 'text-slate-400', badge: 'bg-slate-600 text-white' };
    }
  };

  // Group inventory by category
  const inventoryByCategory = {};
  if (supplierData.inventory) {
    Object.entries(supplierData.inventory).forEach(([id, item]) => {
      const category = item.category || 'Other';
      if (!inventoryByCategory[category]) {
        inventoryByCategory[category] = [];
      }
      inventoryByCategory[category].push({ id, ...item });
    });
  }

  const totalInventoryValue = supplierData.inventory
    ? Object.values(supplierData.inventory).reduce((sum, item) => sum + (item.stock * item.pricePerUnit), 0)
    : 0;

  const lowStockItems = supplierData.inventory
    ? Object.values(supplierData.inventory).filter(item => (item.stock / item.capacity) < 0.2).length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900/20 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span className="text-3xl">📦</span>
                {supplierData.name}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {supplierData.type} • {supplierData.location} • ID: {supplierData.id}
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
          {/* Left Column - Inventory & Orders */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Overview */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Total Items</p>
                <p className="text-2xl font-bold text-blue-400">
                  {supplierData.inventory ? Object.keys(supplierData.inventory).length : 0}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-red-700">
                <p className="text-xs text-slate-400 mb-1">Low Stock</p>
                <p className="text-2xl font-bold text-red-400">{lowStockItems}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Active Orders</p>
                <p className="text-2xl font-bold text-green-400">
                  {supplierData.activeOrders?.length || 0}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Inventory Value</p>
                <p className="text-xl font-bold text-yellow-400">
                  ₹{(totalInventoryValue / 1000).toFixed(0)}K
                </p>
              </div>
            </div>

            {/* Warehouse Inventory */}
            {Object.entries(inventoryByCategory).map(([category, items]) => (
              <div key={category} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  📦 {category}
                </h2>
                <div className="space-y-3">
                  {items.map(item => {
                    const level = getStockLevel(item);
                    const capacityPercent = (item.stock / item.capacity) * 100;

                    return (
                      <div
                        key={item.id}
                        className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-200">{item.name}</h3>
                            <p className="text-xs text-slate-400">{item.id}</p>
                          </div>
                          <span className={`px-3 py-1 rounded text-xs font-bold ${level.bg} text-white`}>
                            {level.text} Stock
                          </span>
                        </div>

                        {/* Stock Bar */}
                        <div className="mb-3">
                          <div className="w-full bg-slate-600 rounded-full h-2">
                            <div
                              className={`${level.bg} h-2 rounded-full transition-all`}
                              style={{ width: `${capacityPercent}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-xs">
                          <div>
                            <p className="text-slate-400">In Stock</p>
                            <p className={`font-semibold text-lg ${level.color}`}>
                              {item.stock}
                            </p>
                            <p className="text-slate-500">{item.unit}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Capacity</p>
                            <p className="font-semibold text-blue-400">{item.capacity}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Reserved</p>
                            <p className="font-semibold text-yellow-400">{item.reserved || 0}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Price/Unit</p>
                            <p className="font-semibold text-green-400">₹{item.pricePerUnit}</p>
                          </div>
                        </div>

                        {capacityPercent < 20 && (
                          <div className="mt-3 bg-red-900/30 border border-red-700 rounded p-2">
                            <p className="text-xs text-red-300">
                              ⚠️ Low stock - Restock recommended
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Active Orders */}
            {supplierData.activeOrders && supplierData.activeOrders.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  📋 Active Orders
                </h2>
                <div className="space-y-3">
                  {supplierData.activeOrders.map((order, index) => (
                    <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">Order #{order.orderId || `ORD-${index + 1}`}</h3>
                          <p className="text-xs text-slate-400">
                            {order.customer} • {order.destination}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded text-xs font-bold ${
                          order.status === 'delivered'
                            ? 'bg-green-600 text-white'
                            : order.status === 'in-transit'
                            ? 'bg-blue-600 text-white'
                            : order.status === 'processing'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-slate-600 text-white'
                        }`}>
                          {order.status?.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                        <div>
                          <p className="text-slate-400">Items</p>
                          <p className="font-semibold">{order.items?.length || 1}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Quantity</p>
                          <p className="font-semibold">{order.totalQuantity || 0}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Priority</p>
                          <p className={`font-semibold ${
                            order.priority === 'urgent' ? 'text-red-400' : 'text-slate-300'
                          }`}>
                            {order.priority || 'Normal'}
                          </p>
                        </div>
                      </div>

                      {order.eta && (
                        <div className="text-xs text-blue-400">
                          📅 ETA: {order.eta}
                        </div>
                      )}

                      {order.vehicle && (
                        <div className="text-xs text-slate-400 mt-1">
                          🚚 Vehicle: {order.vehicle}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Fleet & Info */}
          <div className="space-y-6">
            {/* Supplier Info */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4">ℹ️ Supplier Info</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-semibold text-blue-400">{supplierData.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="font-semibold text-orange-400">{supplierData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Coverage:</span>
                  <span className="font-semibold text-green-400">
                    {supplierData.coverage || 'Citywide'}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Fleet */}
            {supplierData.fleet && (
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  🚚 Delivery Fleet
                </h2>
                <div className="space-y-3">
                  {Object.entries(supplierData.fleet).map(([vehicleId, vehicle]) => {
                    const status = getVehicleStatus(vehicle.status);
                    
                    return (
                      <div key={vehicleId} className="bg-slate-700/50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-sm">{vehicle.type}</h4>
                            <p className="text-xs text-slate-400">{vehicleId}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${status.badge}`}>
                            {vehicle.status?.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-slate-400">Capacity</p>
                            <p className="font-semibold">{vehicle.capacity}</p>
                          </div>
                          {vehicle.currentLoad !== undefined && (
                            <div>
                              <p className="text-slate-400">Current Load</p>
                              <p className="font-semibold text-blue-400">{vehicle.currentLoad}</p>
                            </div>
                          )}
                        </div>

                        {vehicle.destination && (
                          <div className="mt-2 pt-2 border-t border-slate-600 text-xs text-slate-400">
                            📍 {vehicle.destination}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Fleet Summary */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-900/20 rounded p-2">
                      <p className="text-slate-400 mb-1">Available</p>
                      <p className="text-lg font-bold text-green-400">
                        {Object.values(supplierData.fleet).filter(v => v.status === 'available').length}
                      </p>
                    </div>
                    <div className="bg-blue-900/20 rounded p-2">
                      <p className="text-slate-400 mb-1">In Transit</p>
                      <p className="text-lg font-bold text-blue-400">
                        {Object.values(supplierData.fleet).filter(v => v.status === 'in-transit').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Agent Activity */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4">🤖 AI Agent Activity</h2>
              <div className="bg-green-900/20 border border-green-700 rounded p-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="text-sm text-green-300 font-semibold">Supplier Agent Active</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Managing inventory and fulfilling orders
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

export default SupplierDashboard;

