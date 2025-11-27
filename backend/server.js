// backend/server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const worldState = require('./worldState');
const { initAgents, setLogSender } = require('./agents/initAgents');
const stateRoutes = require('./routes/stateRoutes');
const { attachIO, getLogs, sendLog } = require('./logger'); // ✅ use logger.js

const app = express();
app.use(cors());
app.use(express.json());

// HTTP + Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // in production, set specific frontend URL
  },
});

// ✅ connect Socket.io to logger
attachIO(io);

// ✅ give agents the logger's sendLog function
setLogSender(sendLog);

// ✅ REST routes (pass worldState + getLogs function)
app.use('/api', stateRoutes(worldState, getLogs));

// Basic health check
app.get('/', (req, res) => {
  res.send('HealSync backend is running');
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Frontend connected:', socket.id);
  socket.emit('connected', { msg: 'Connected to HealSync backend' });
});

// Start agents (they will run in intervals)
initAgents(worldState);

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
