const crypto = require('crypto');

// Set OWNER_TOKEN_SECRET in .env; otherwise tokens stop working after every restart.
const SECRET = process.env.OWNER_TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.OWNER_TOKEN_SECRET) {
  console.warn('[WARN] OWNER_TOKEN_SECRET not set: owner logins reset on every server restart.');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, 'hex');
  const b = crypto.scryptSync(String(password), salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const mac = (body) => crypto.createHmac('sha256', SECRET).update(body).digest('base64url');

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${mac(body)}`;
}

function verifyToken(token) {
  if (typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(mac(body));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken };
