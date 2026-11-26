const ownerModel = require('../models/ownerModel');
const { emitToRoom } = require('./realtimeService');
const { sendToOwner } = require('./pushService');

const COOLDOWN_MS = 2 * 60 * 1000; // do not push the same belt+level more than once per 2 min
const recent = new Map();

const MESSAGES = {
  ANIMAL_NEAR_ROAD: (who, pole) => ({ title: 'Animal near the road', body: `${who} was detected near the road at ${pole}.` }),
  ANIMAL_ON_ROAD_EMERGENCY: (who, pole) => ({ title: 'EMERGENCY: animal on road', body: `${who} is ON the road at ${pole}. Please act quickly.` }),
  ANIMAL_LEFT: (who, pole) => ({ title: 'Animal left the road', body: `${who} is no longer detected at ${pole}.` })
};

function notifyOwner(alert) {
  if (alert.level === 'TEST_ALERT') return;
  const animal = ownerModel.getAnimal(alert.animalId);
  const build = MESSAGES[alert.level];
  if (!animal || !build) return;

  const who = animal.label ? `${animal.label} (belt #${animal.beltId})` : `Belt #${animal.beltId}`;
  const payload = {
    ...build(who, alert.poleId),
    alertId: alert.id,
    beltId: animal.beltId,
    level: alert.level,
    poleId: alert.poleId,
    lat: alert.lat,
    lng: alert.lng,
    mapLink: alert.mapLink,
    time: alert.time
  };

  // Live update for the open owner app.
  emitToRoom(`owner:${animal.ownerId}`, 'owner-alert', payload);

  // Background push (rate limited).
  const key = `${alert.animalId}:${alert.level}`;
  if (Date.now() - (recent.get(key) || 0) < COOLDOWN_MS) return;
  recent.set(key, Date.now());
  sendToOwner(animal.ownerId, payload).catch((error) => console.warn('[PUSH]', error.message));
}

module.exports = { notifyOwner };
