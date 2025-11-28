// backend/logger.js
let ioRef = null;
const logs = [];

function attachIO(io) {
  ioRef = io;
}

function getLogs() {
  return logs;
}

function sendLog(message, meta = {}) {
  const entry = {
    message,
    meta,
    timestamp: new Date().toISOString(),
  };

  logs.unshift(entry);
  if (logs.length > 200) logs.pop();

  console.log('[AGENT]', message);
  if (ioRef) {
    ioRef.emit('agent-log', entry);
  }
}

module.exports = { attachIO, getLogs, sendLog };
