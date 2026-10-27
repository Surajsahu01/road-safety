const express = require('express');
const { checkDanger } = require('../controllers/alertController');

const router = express.Router();
router.post('/check-danger', checkDanger);

module.exports = router;
