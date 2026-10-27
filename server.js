require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { PORT, HOST, DEVICE_API_KEY, ADMIN_KEY, corsOrigin } = require('./config/env');
const { setIO } = require('./services/realtimeService');
const { checkPoleOnlineStatus } = require('./controllers/realtimeController');

// Initialize database and its schema before accepting requests.
require('./db/database');

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: corsOrigin } });
setIO(io);

io.on('connection', (socket) => {
  socket.emit('server-status', {
    connected: true,
    time: new Date().toISOString()
  });
});

setInterval(checkPoleOnlineStatus, 30000);

if (DEVICE_API_KEY === 'CHANGE_THIS_DEVICE_KEY') {
  console.warn('[WARN] DEVICE_API_KEY is the default value. Set a real key in .env and in the pole setup page.');
}
if (!ADMIN_KEY) {
  console.warn('[WARN] ADMIN_KEY not set: acknowledging alerts from the dashboard is disabled.');
}

server.listen(PORT, HOST, () => {
  console.log(`API listening on http://${HOST}:${PORT}`);
});
