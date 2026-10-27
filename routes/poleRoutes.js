const express = require('express');
const { requireDevice } = require('../middleware/auth');
const { reportPoleStatus, listPoles } = require('../controllers/poleController');

const router = express.Router();

router.get('/', listPoles);
router.post('/status', requireDevice, reportPoleStatus);

module.exports = router;
