// frontend/src/components/ActiveAlerts.jsx
function ActiveAlerts({ cityData }) {
  if (!cityData || !cityData.city || !cityData.city.activeAlerts) {
    return null;
  }

  const { activeAlerts } = cityData.city;

  if (activeAlerts.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-bold mb-4">🔔 Active Public Health Alerts</h3>
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-green-300 font-semibold">All Clear</p>
          <p className="text-sm text-slate-400 mt-2">
            No active health alerts in your area. System operating normally.
          </p>
        </div>
      </div>
    );
  }

  const getAlertStyle = (priority) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-red-900/30',
          border: 'border-red-600',
          icon: '🚨',
          text: 'text-red-300',
          badge: 'bg-red-600 text-white'
        };
      case 'high':
        return {
          bg: 'bg-orange-900/30',
          border: 'border-orange-600',
          icon: '⚠️',
          text: 'text-orange-300',
          badge: 'bg-orange-600 text-white'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-900/30',
          border: 'border-yellow-600',
          icon: '📢',
          text: 'text-yellow-300',
          badge: 'bg-yellow-600 text-white'
        };
      default:
        return {
          bg: 'bg-blue-900/30',
          border: 'border-blue-600',
          icon: 'ℹ️',
          text: 'text-blue-300',
          badge: 'bg-blue-600 text-white'
        };
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">🔔 Active Public Health Alerts</h3>
        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {activeAlerts.length} Active
        </span>
      </div>

      <div className="space-y-4">
        {activeAlerts.slice(0, 5).map((alert, index) => {
          const style = getAlertStyle(alert.priority || alert.severity || 'medium');
          
          return (
            <div
              key={index}
              className={`
                ${style.bg} border-2 ${style.border} rounded-lg p-5
                transition-all hover:shadow-lg
              `}
            >
              {/* Alert Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{style.icon}</span>
                  <div>
                    <h4 className={`font-bold text-lg ${style.text}`}>
                      {alert.title || alert.type?.replace(/_/g, ' ').toUpperCase() || 'Health Alert'}
                    </h4>
                    {alert.zone && (
                      <span className="text-sm text-slate-400">
                        📍 {alert.zone}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${style.badge}`}>
                    {(alert.priority || alert.severity || 'medium').toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatTimestamp(alert.timestamp)}
                  </span>
                </div>
              </div>

              {/* Alert Message */}
              <p className="text-slate-200 mb-3 pl-11">
                {alert.message || alert.description}
              </p>

              {/* Alert Details */}
              {alert.details && (
                <div className="pl-11 text-sm text-slate-400 space-y-1">
                  {typeof alert.details === 'object' ? (
                    Object.entries(alert.details).map(([key, value]) => (
                      <p key={key}>
                        <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {value}
                      </p>
                    ))
                  ) : (
                    <p>{alert.details}</p>
                  )}
                </div>
              )}

              {/* Actions Taken */}
              {alert.actionsTaken && alert.actionsTaken.length > 0 && (
                <div className="mt-3 pl-11 pt-3 border-t border-slate-700">
                  <p className="text-xs font-semibold text-slate-400 mb-2">
                    🤖 AI Agent Actions:
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {alert.actionsTaken.map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Status */}
              {alert.status && (
                <div className="mt-3 pl-11">
                  <span className={`text-xs px-2 py-1 rounded ${
                    alert.status === 'resolved' 
                      ? 'bg-green-600/30 text-green-300'
                      : alert.status === 'monitoring'
                      ? 'bg-blue-600/30 text-blue-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    Status: {alert.status}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeAlerts.length > 5 && (
        <div className="text-center mt-4">
          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
            View All {activeAlerts.length} Alerts →
          </button>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 text-center">
          <span className="font-semibold">Powered by AI Agents:</span> All alerts are automatically 
          detected and coordinated responses are triggered by autonomous healthcare agents.
        </p>
      </div>
    </div>
  );
}

export default ActiveAlerts;

