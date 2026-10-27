const express = require('express');
const { requireDevice, requireAdmin } = require('../middleware/auth');
const {
  createAlert,
  listAlerts,
  getStats,
  acknowledgeAlert,
  deleteAlert,
  acknowledgeAll
} = require('../controllers/alertController');

const router = express.Router();

router.post('/', requireDevice, createAlert);
router.get('/', listAlerts);
router.get('/stats', getStats);
router.post('/ack-all', requireAdmin, acknowledgeAll);
router.post('/:id/ack', requireAdmin, acknowledgeAlert);
router.delete('/:id', deleteAlert);

module.exports = router;
