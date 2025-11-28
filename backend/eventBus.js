// backend/eventBus.js
const listeners = {};

function subscribe(eventType, handler) {
  if (!listeners[eventType]) listeners[eventType] = [];
  listeners[eventType].push(handler);
}

function publish(eventType, payload) {
  if (listeners[eventType]) {
    listeners[eventType].forEach((handler) => handler(payload));
  }
}

module.exports = { subscribe, publish };
