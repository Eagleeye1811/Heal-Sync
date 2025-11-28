// frontend/src/components/AlertList.jsx
// Reusable alert list component

function AlertList({ alerts, title = "Active Alerts" }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
        <h3 className="text-sm font-bold mb-2 text-green-400">✅ {title}</h3>
        <p className="text-xs text-green-300">All systems normal - No active alerts</p>
      </div>
    );
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'OUTBREAK_DETECTED':
      case 'MEDICINE_SHORTAGE':
        return 'border-red-600 bg-red-900/20 text-red-300';
      case 'BED_ALLOCATION':
      case 'COORDINATION':
        return 'border-yellow-600 bg-yellow-900/20 text-yellow-300';
      case 'ORDER_CONFIRMED':
        return 'border-green-600 bg-green-900/20 text-green-300';
      default:
        return 'border-blue-600 bg-blue-900/20 text-blue-300';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'OUTBREAK_DETECTED': return '🚨';
      case 'BED_ALLOCATION': return '🛏️';
      case 'MEDICINE_SHORTAGE': return '💊';
      case 'ORDER_CONFIRMED': return '✅';
      case 'COORDINATION': return '📡';
      default: return '⚠️';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
        ⚠️ {title}
        <span className="ml-auto bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">
          {alerts.length}
        </span>
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {alerts.map((alert, idx) => (
          <div
            key={idx}
            className={`border rounded-lg p-3 ${getAlertColor(alert.type)}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-xl">{getAlertIcon(alert.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{alert.message}</p>
                {alert.timestamp && (
                  <p className="text-[9px] mt-1 opacity-70">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertList;

