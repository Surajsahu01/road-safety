const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { corsOrigin } = require('./config/env');

const healthRoutes = require('./routes/healthRoutes');
const alertRoutes = require('./routes/alertRoutes');
const poleRoutes = require('./routes/poleRoutes');
const driverRoutes = require('./routes/driverRoutes');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: corsOrigin, exposedHeaders: ['X-Total-Count'] }));
app.use(express.json({ limit: '20kb' }));

app.use('/api/health', healthRoutes);
app.use('/api/alerts', alertRoutes);
// Compatibility alias used by older dashboard builds.
app.get('/api/stats', require('./controllers/alertController').getStats);
app.use('/api/poles', poleRoutes);
app.use('/api', driverRoutes);

module.exports = app;
