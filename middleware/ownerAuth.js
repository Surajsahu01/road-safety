const { verifyToken } = require('../utils/ownerAuth');

function requireOwner(req, res, next) {
  const header = req.get('Authorization') || '';
  const payload = verifyToken(header.startsWith('Bearer ') ? header.slice(7) : '');
  if (!payload) return res.status(401).json({ error: 'unauthorized_owner' });
  req.ownerId = payload.id;
  return next();
}

module.exports = { requireOwner };
