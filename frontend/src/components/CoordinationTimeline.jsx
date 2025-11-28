// frontend/src/components/CoordinationTimeline.jsx
// Visual Timeline showing agent coordination as a story
import { useState } from 'react';

function CoordinationTimeline({ logs }) {
  const [expandedEvents, setExpandedEvents] = useState(new Set());

  const toggleEvent = (index) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedEvents(newExpanded);
  };

  // Group logs into coordination events
  const groupLogsIntoEvents = (logs) => {
    const events = [];
    let currentEvent = null;

    logs.forEach((log, idx) => {
      if (log.separator) {
        if (currentEvent) events.push(currentEvent);
        currentEvent = {
          type: 'separator',
          label: log.label,
          timestamp: log.timestamp,
          index: idx
        };
        return;
      }

      const isOutbreak = log.message?.toLowerCase().includes('outbreak') || 
                        log.message?.toLowerCase().includes('surge') ||
                        log.meta?.type === 'OUTBREAK_DETECTED' ||
                        log.meta?.type === 'SCENARIO_TRIGGER';
      
      const isCoordination = log.meta?.type === 'COORDINATION' ||
                            log.meta?.type === 'ALERT_RECEIVED' ||
                            log.meta?.type === 'BED_ALLOCATION' ||
                            log.meta?.type === 'ORDER_PLACED' ||
                            log.meta?.type === 'ORDER_CONFIRMED';

      if (isOutbreak || log.separator) {
        if (currentEvent) events.push(currentEvent);
        currentEvent = {
          type: 'event',
          category: isOutbreak ? 'outbreak' : 'coordination',
          mainLog: log,
          relatedLogs: [],
          timestamp: log.timestamp,
          index: idx
        };
      } else if (currentEvent && currentEvent.type === 'event' && isCoordination) {
        currentEvent.relatedLogs.push(log);
      } else if (currentEvent && currentEvent.type === 'event') {
        currentEvent.relatedLogs.push(log);
      } else {
        // Standalone log
        events.push({
          type: 'standalone',
          mainLog: log,
          timestamp: log.timestamp,
          index: idx
        });
      }
    });

    if (currentEvent) events.push(currentEvent);
    return events.reverse().slice(0, 20); // Show last 20 events
  };

  const getAgentIcon = (agent) => {
    const agentLower = agent?.toLowerCase() || '';
    if (agentLower.includes('lab')) return '🔬';
    if (agentLower.includes('hospital')) return '🏥';
    if (agentLower.includes('pharmacy')) return '💊';
    if (agentLower.includes('supplier')) return '📦';
    if (agentLower.includes('city')) return '🏙️';
    return '🤖';
  };

  const getEventIcon = (log) => {
    const msg = log.message?.toLowerCase() || '';
    const type = log.meta?.type || '';
    
    if (msg.includes('outbreak') || msg.includes('surge')) return '🚨';
    if (msg.includes('alert') || type === 'ALERT_RECEIVED') return '⚠️';
    if (msg.includes('bed') || type === 'BED_ALLOCATION') return '🛏️';
    if (msg.includes('medicine') || msg.includes('order')) return '💊';
    if (msg.includes('delivery') || msg.includes('dispatch')) return '🚚';
    if (msg.includes('confirm')) return '✅';
    if (msg.includes('coordinating') || type === 'COORDINATION') return '📡';
    return '📝';
  };

  const getEventColor = (event) => {
    if (event.category === 'outbreak') {
      return {
        border: 'border-red-500',
        bg: 'bg-red-900/20',
        glow: 'shadow-red-500/50',
        text: 'text-red-300'
      };
    }
    if (event.category === 'coordination') {
      return {
        border: 'border-blue-500',
        bg: 'bg-blue-900/20',
        glow: 'shadow-blue-500/50',
        text: 'text-blue-300'
      };
    }
    return {
      border: 'border-slate-600',
      bg: 'bg-slate-800/50',
      glow: '',
      text: 'text-slate-300'
    };
  };

  const events = groupLogsIntoEvents(logs);

  return (
    <div className="space-y-3">
      {events.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-slate-700">
          <div className="text-6xl mb-3">⏳</div>
          <p className="text-slate-400 mb-2">Waiting for agent activity...</p>
          <p className="text-xs text-slate-500">Trigger a scenario or wait for natural events to occur</p>
        </div>
      ) : (
        events.map((event, idx) => {
          if (event.type === 'separator') {
            return (
              <div key={event.index} className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
                <span className="text-xs font-bold text-yellow-400 px-3 py-1 bg-yellow-900/20 border border-yellow-500 rounded-full">
                  ⚡ {event.label}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-yellow-500 via-yellow-500 to-transparent"></div>
              </div>
            );
          }

          const mainLog = event.mainLog;
          const colors = getEventColor(event);
          const isExpanded = expandedEvents.has(event.index);
          const hasDetails = event.relatedLogs && event.relatedLogs.length > 0;

          return (
            <div 
              key={event.index}
              className={`border-l-4 ${colors.border} ${colors.bg} rounded-r-lg overflow-hidden transition-all duration-300 ${colors.glow ? 'shadow-lg ' + colors.glow : ''}`}
            >
              {/* Main Event Card */}
              <div 
                onClick={() => hasDetails && toggleEvent(event.index)}
                className={`p-4 ${hasDetails ? 'cursor-pointer hover:bg-slate-700/30' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Timeline Dot */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors.border.replace('border', 'from')} to-slate-700 flex items-center justify-center text-xl border-2 ${colors.border}`}>
                      {getEventIcon(mainLog)}
                    </div>
                    {hasDetails && isExpanded && (
                      <div className="w-px h-full bg-slate-600 mt-2"></div>
                    )}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {getAgentIcon(mainLog.meta?.agent)} {mainLog.meta?.agent || 'System'}
                        </span>
                        {mainLog.meta?.entityId && (
                          <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-400">
                            {mainLog.meta.entityId}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(mainLog.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Message */}
                    <p className={`text-sm ${colors.text} font-medium mb-2`}>
                      {mainLog.message}
                    </p>

                    {/* Expand Indicator */}
                    {hasDetails && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-400">
                          {isExpanded ? '▼' : '▶'} {event.relatedLogs.length} related action{event.relatedLogs.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Related Actions (Expanded) */}
                {hasDetails && isExpanded && (
                  <div className="ml-16 mt-3 space-y-2 border-l-2 border-slate-600 pl-4">
                    {event.relatedLogs.map((relatedLog, relIdx) => (
                      <div key={relIdx} className="bg-slate-700/30 rounded p-3 border border-slate-600">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getEventIcon(relatedLog)}</span>
                          <span className="text-xs font-semibold text-slate-300">
                            {getAgentIcon(relatedLog.meta?.agent)} {relatedLog.meta?.agent || 'System'}
                          </span>
                          <span className="text-[9px] text-slate-500 ml-auto">
                            {new Date(relatedLog.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 pl-7">{relatedLog.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default CoordinationTimeline;

