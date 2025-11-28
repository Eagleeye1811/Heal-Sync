// frontend/src/components/LoginModal.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LoginModal({ isOpen, onClose }) {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [entities, setEntities] = useState([]);
  const [worldState, setWorldState] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Fetch world state to get available entities
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/state');
        const data = await res.json();
        setWorldState(data);
      } catch (err) {
        console.error('Error fetching state:', err);
      }
    };
    fetchState();
  }, []);

  // Update available entities when role changes
  useEffect(() => {
    if (!worldState) return;

    let entityList = [];
    switch (selectedRole) {
      case 'hospital':
        entityList = Object.entries(worldState.hospitals || {}).map(([id, h]) => ({
          id,
          name: h.name,
          zone: h.zone
        }));
        break;
      case 'lab':
        entityList = Object.entries(worldState.labs || {}).map(([id, l]) => ({
          id,
          name: l.name,
          zone: l.zone
        }));
        break;
      case 'pharmacy':
        entityList = Object.entries(worldState.pharmacies || {}).map(([id, p]) => ({
          id,
          name: p.name,
          zone: p.zone
        }));
        break;
      case 'supplier':
        entityList = Object.entries(worldState.suppliers || {}).map(([id, s]) => ({
          id,
          name: s.name,
          location: s.location
        }));
        break;
      case 'city':
        entityList = [{ id: 'city', name: 'City Command Center', zone: 'All Zones' }];
        break;
      default:
        entityList = [];
    }
    setEntities(entityList);
    setSelectedEntity('');
  }, [selectedRole, worldState]);

  const handleLogin = () => {
    if (!selectedRole) {
      alert('Please select a role');
      return;
    }

    if (selectedRole !== 'city' && !selectedEntity) {
      alert('Please select a facility');
      return;
    }

    const entityId = selectedRole === 'city' ? 'city' : selectedEntity;
    const entity = entities.find(e => e.id === entityId);
    const entityName = entity ? entity.name : 'Unknown';

    login(selectedRole, entityId, entityName);

    // Navigate to appropriate dashboard
    if (selectedRole === 'city') {
      navigate('/city');
    } else {
      navigate(`/${selectedRole}/${entityId}`);
    }

    onClose();
  };

  if (!isOpen) return null;

  const roles = [
    { id: 'city', name: '🏙️ City Command Center', desc: 'Full system oversight and scenario control' },
    { id: 'hospital', name: '🏥 Hospital', desc: 'Bed capacity, patient flow, resource requests' },
    { id: 'lab', name: '🔬 Laboratory', desc: 'Disease testing, outbreak detection' },
    { id: 'pharmacy', name: '💊 Pharmacy', desc: 'Medicine inventory, ordering, stock alerts' },
    { id: 'supplier', name: '📦 Supplier', desc: 'Inventory management, order fulfillment' }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-6 border-b border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">🔐 Professional Login</h2>
              <p className="text-slate-300 text-sm">
                Select your role to access the HealSync Network
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Select Your Role:
            </label>
            <div className="grid gap-3">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`
                    text-left p-4 rounded-lg border-2 transition-all
                    ${selectedRole === role.id
                      ? 'bg-blue-900/30 border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
                    }
                  `}
                >
                  <div className="font-semibold mb-1">{role.name}</div>
                  <div className="text-xs text-slate-400">{role.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Entity Selection */}
          {selectedRole && selectedRole !== 'city' && entities.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Select Your Facility:
              </label>
              <div className="grid gap-2">
                {entities.map(entity => (
                  <button
                    key={entity.id}
                    onClick={() => setSelectedEntity(entity.id)}
                    className={`
                      text-left p-3 rounded-lg border transition-all
                      ${selectedEntity === entity.id
                        ? 'bg-blue-900/30 border-blue-500'
                        : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
                      }
                    `}
                  >
                    <div className="font-medium">{entity.name}</div>
                    <div className="text-xs text-slate-400">
                      {entity.zone || entity.location} • ID: {entity.id}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* City Role Info */}
          {selectedRole === 'city' && (
            <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <h4 className="font-semibold text-purple-300 mb-1">
                    City Administrator Access
                  </h4>
                  <p className="text-sm text-slate-300">
                    You will have full visibility of all healthcare facilities, 
                    agents, and can trigger simulation scenarios.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Demo Note */}
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">ℹ️</span>
              <div>
                <h4 className="font-semibold text-yellow-300 mb-1 text-sm">
                  Demo Mode
                </h4>
                <p className="text-xs text-slate-300">
                  This is a demonstration environment. In production, authentication 
                  would be handled via secure credentials and role-based access control.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-900/50 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLogin}
            disabled={!selectedRole || (selectedRole !== 'city' && !selectedEntity)}
            className={`
              px-6 py-2 rounded-lg font-semibold transition-colors
              ${selectedRole && (selectedRole === 'city' || selectedEntity)
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            Access Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;

