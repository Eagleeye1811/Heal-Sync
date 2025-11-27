// backend/routes/stateRoutes.js
const express = require('express');

module.exports = (worldState, getLogs) => {
  const router = express.Router();

  // Return full current state (for frontend dashboard)
  router.get('/state', (req, res) => {
    res.json(worldState);
  });

  // Return recent logs (using getLogs from logger)
  router.get('/logs', (req, res) => {
    const logs = getLogs();
    res.json(logs.slice(0, 50));
  });

  // Simulate a dengue spike event by increasing today's tests
  router.post('/simulate/dengue', (req, res) => {
    worldState.labs.L1.dengueTestsToday += 20; // simple spike
    res.json({ ok: true, dengueTestsToday: worldState.labs.L1.dengueTestsToday });
  });

  return router;
};
