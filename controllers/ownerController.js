const ownerModel = require('../models/ownerModel');
const { hashPassword, verifyPassword, signToken } = require('../utils/ownerAuth');
const { withLink } = require('../utils/alertUtils');
const { VAPID_PUBLIC_KEY } = require('../services/pushService');

// The login ID can be an email address or a phone number (stored in the `phone` column).
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function normalizeLogin(value) {
  const v = String(value || '').trim();
  if (v.includes('@')) return EMAIL.test(v) && v.length <= 100 ? v.toLowerCase() : null;
  const phone = v.replace(/[\s-]/g, '');
  return /^\+?\d{10,15}$/.test(phone) ? phone : null;
}
const THIRTY_DAYS = 30 * 24 * 3600 * 1000;

const publicOwner = (o) => ({ id: o.id, name: o.name, login: o.phone });
const session = (owner) => ({
  token: signToken({ id: owner.id, exp: Date.now() + THIRTY_DAYS }),
  owner: publicOwner(owner)
});

function register(req, res) {
  const { name, password } = req.body || {};
  const login = normalizeLogin(req.body?.login ?? req.body?.email ?? req.body?.phone);
  const fields = [];
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 60) fields.push('name');
  if (!login) fields.push('login');
  if (typeof password !== 'string' || password.length < 8 || password.length > 100) fields.push('password');
  if (fields.length) return res.status(400).json({ error: 'invalid_owner_payload', fields });
  if (ownerModel.getOwnerByPhone(login)) return res.status(409).json({ error: 'account_already_registered' });

  const info = ownerModel.createOwner(name.trim(), login, hashPassword(password));
  return res.status(201).json(session(ownerModel.getOwnerById(Number(info.lastInsertRowid))));
}

function login(req, res) {
  const owner = ownerModel.getOwnerByPhone(normalizeLogin(req.body?.login ?? req.body?.email ?? req.body?.phone));
  if (!owner || !verifyPassword(req.body?.password, owner.passHash)) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  return res.json(session(owner));
}

const me = (req, res) => {
  const owner = ownerModel.getOwnerById(req.ownerId);
  return owner ? res.json(publicOwner(owner)) : res.status(401).json({ error: 'unauthorized_owner' });
};

function listAnimals(req, res) {
  return res.json(ownerModel.listAnimals(req.ownerId).map((animal) => {
    const last = ownerModel.lastAlertForBelt(animal.beltId);
    return { ...animal, lastAlert: last ? withLink(last) : null };
  }));
}

function addAnimal(req, res) {
  const beltId = Number(req.body?.beltId);
  const label = typeof req.body?.label === 'string' ? req.body.label.trim().slice(0, 40) : '';
  const species = typeof req.body?.species === 'string' ? req.body.species.trim().slice(0, 30) : '';
  if (!Number.isInteger(beltId) || beltId < 1 || beltId > 255) {
    return res.status(400).json({ error: 'invalid_belt_id' });
  }
  if (ownerModel.getAnimal(beltId)) return res.status(409).json({ error: 'belt_already_registered' });

  ownerModel.addAnimal(beltId, req.ownerId, label || null, species || null);
  return res.status(201).json(ownerModel.getAnimal(beltId));
}

function removeAnimal(req, res) {
  const info = ownerModel.removeAnimal(Number(req.params.beltId), req.ownerId);
  return info.changes ? res.json({ deleted: true }) : res.status(404).json({ error: 'not_found' });
}

// Admin only: free a belt that was registered by mistake or by the wrong person.
function releaseAnimal(req, res) {
  const info = ownerModel.releaseAnimal(Number(req.params.beltId));
  return info.changes ? res.json({ released: true }) : res.status(404).json({ error: 'not_found' });
}

function listAlerts(req, res) {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  return res.json(ownerModel.listOwnerAlerts(req.ownerId, limit).map(withLink));
}

const vapidKey = (_req, res) => res.json({ key: VAPID_PUBLIC_KEY || null });

function subscribePush(req, res) {
  const sub = req.body?.subscription;
  const valid = sub && typeof sub.endpoint === 'string' && sub.endpoint.startsWith('https://') &&
    typeof sub.keys?.p256dh === 'string' && typeof sub.keys?.auth === 'string';
  if (!valid) return res.status(400).json({ error: 'invalid_subscription' });
  ownerModel.saveSubscription(req.ownerId, sub);
  return res.json({ status: 'subscribed' });
}

module.exports = {
  register, login, me, listAnimals, addAnimal, removeAnimal, releaseAnimal,
  listAlerts, vapidKey, subscribePush
};
