const crypto = require('crypto');
const { DEVICE_API_KEY, ADMIN_KEY } = require('../config/env');

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function requireDevice(req, res, next) {
  return safeEqual(req.get('X-Device-Key'), DEVICE_API_KEY)
    ? next()
    : res.status(401).json({ error: 'unauthorized_device' });
}

function requireAdmin(req, res, next) {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: 'admin_key_not_configured' });
  }

  return safeEqual(req.get('X-Admin-Key'), ADMIN_KEY)
    ? next()
    : res.status(401).json({ error: 'unauthorized_admin' });
}

module.exports = { requireDevice, requireAdmin };
