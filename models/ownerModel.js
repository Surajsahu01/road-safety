const db = require('../db/database');

const NOT_TEST = "level != 'TEST_ALERT'";
// Only alerts after the owner registered the belt (a belt may change hands).
const SINCE_REGISTERED = '(SELECT createdAt FROM animals WHERE beltId = alerts.animalId)';

function createOwner(name, phone, passHash) {
  return db.prepare('INSERT INTO owners (name, phone, passHash, createdAt) VALUES (?, ?, ?, ?)')
    .run(name, phone, passHash, new Date().toISOString());
}
const getOwnerByPhone = (phone) => db.prepare('SELECT * FROM owners WHERE phone = ?').get(phone);
const getOwnerById = (id) => db.prepare('SELECT * FROM owners WHERE id = ?').get(id);

function addAnimal(beltId, ownerId, label, species) {
  return db.prepare('INSERT INTO animals (beltId, ownerId, label, species, createdAt) VALUES (?, ?, ?, ?, ?)')
    .run(beltId, ownerId, label, species, new Date().toISOString());
}
const getAnimal = (beltId) => db.prepare(`
  SELECT an.*, o.name AS ownerName FROM animals an
  JOIN owners o ON o.id = an.ownerId WHERE an.beltId = ?`).get(beltId);
const listAnimals = (ownerId) => db.prepare('SELECT * FROM animals WHERE ownerId = ? ORDER BY beltId').all(ownerId);
const removeAnimal = (beltId, ownerId) =>
  db.prepare('DELETE FROM animals WHERE beltId = ? AND ownerId = ?').run(beltId, ownerId);
const releaseAnimal = (beltId) => db.prepare('DELETE FROM animals WHERE beltId = ?').run(beltId);

const lastAlertForBelt = (beltId) => db.prepare(`
  SELECT * FROM alerts WHERE animalId = ? AND ${NOT_TEST} AND time >= ${SINCE_REGISTERED}
  ORDER BY time DESC, id DESC LIMIT 1`).get(beltId);

const listOwnerAlerts = (ownerId, limit) => db.prepare(`
  SELECT * FROM alerts
  WHERE animalId IN (SELECT beltId FROM animals WHERE ownerId = ?)
    AND ${NOT_TEST} AND time >= ${SINCE_REGISTERED}
  ORDER BY time DESC, id DESC LIMIT ?`).all(ownerId, limit);

const saveSubscription = (ownerId, subscription) => db.prepare(`
  INSERT INTO push_subscriptions (endpoint, ownerId, subscription, createdAt) VALUES (?, ?, ?, ?)
  ON CONFLICT(endpoint) DO UPDATE SET ownerId = excluded.ownerId, subscription = excluded.subscription`)
  .run(subscription.endpoint, ownerId, JSON.stringify(subscription), new Date().toISOString());
const listSubscriptions = (ownerId) => db.prepare('SELECT * FROM push_subscriptions WHERE ownerId = ?').all(ownerId);
const deleteSubscription = (endpoint) => db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);

module.exports = {
  createOwner, getOwnerByPhone, getOwnerById,
  addAnimal, getAnimal, listAnimals, removeAnimal, releaseAnimal,
  lastAlertForBelt, listOwnerAlerts,
  saveSubscription, listSubscriptions, deleteSubscription
};
