const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { requireOwner } = require('../middleware/ownerAuth');
const c = require('../controllers/ownerController');

const router = express.Router();

router.post('/register', c.register);
router.post('/login', c.login);
router.get('/vapid-key', c.vapidKey);

router.get('/me', requireOwner, c.me);
router.get('/animals', requireOwner, c.listAnimals);
router.post('/animals', requireOwner, c.addAnimal);
router.delete('/animals/:beltId', requireOwner, c.removeAnimal);
router.get('/alerts', requireOwner, c.listAlerts);
router.post('/push-subscribe', requireOwner, c.subscribePush);

router.delete('/admin/animals/:beltId', requireAdmin, c.releaseAnimal);

module.exports = router;
