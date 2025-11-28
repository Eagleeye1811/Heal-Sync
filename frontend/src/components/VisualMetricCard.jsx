// frontend/src/components/VisualMetricCard.jsx
// Reusable metric card component with visual appeal

function VisualMetricCard({ icon, title, value, subtitle, status = 'normal', large = false }) {
  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return 'from-red-600 to-red-700 border-red-400';
      case 'warning':
        return 'from-yellow-600 to-yellow-700 border-yellow-400';
      case 'success':
        return 'from-green-600 to-green-700 border-green-400';
      case 'info':
        return 'from-blue-600 to-blue-700 border-blue-400';
      default:
        return 'from-slate-600 to-slate-700 border-slate-500';
    }
  };

  return (
    <div className={`bg-gradient-to-br ${getStatusColor()} rounded-lg p-4 border-2 hover:scale-105 transition-transform duration-200 shadow-lg`}>
      <div className={`${large ? 'text-5xl' : 'text-3xl'} mb-2`}>{icon}</div>
      <div className={`${large ? 'text-4xl' : 'text-2xl'} font-bold text-white mb-1`}>
        {value}
      </div>
      <div className="text-xs text-white/90 font-semibold">{title}</div>
      {subtitle && (
        <div className="text-[10px] text-white/70 mt-1">{subtitle}</div>
      )}
    </div>
  );
}

export default VisualMetricCard;

