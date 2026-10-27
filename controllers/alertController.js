// const { LEVELS, EMERGENCY, MAX_EVENT_AGE_MS } = require('../config/env');
// const { validCoord, isNil } = require('../utils/validation');
// const { withLink, distanceKm } = require('../utils/alertUtils');
// const { poleView } = require('../utils/poleUtils');
// const alertModel = require('../models/alertModel');
// const poleModel = require('../models/poleModel');
// const { emitEvent } = require('../services/realtimeService');

// function createAlert(req, res) {
//   const body = req.body || {};
//   const { poleId, animalId, level } = body;
//   const lat = isNil(body.lat) ? null : body.lat;
//   const lng = isNil(body.lng) ? null : body.lng;
//   const gpsAgeMs = isNil(body.gpsAgeMs) ? null : body.gpsAgeMs;
//   const ageMs = isNil(body.ageMs) ? 0 : body.ageMs;
//   const isTest = level === 'TEST_ALERT';

//   const problems = [];
//   if (typeof poleId !== 'string' || poleId.length < 1 || poleId.length > 80) problems.push('poleId');
//   if (!Number.isInteger(animalId) || animalId < (isTest ? 0 : 1) || animalId > 255) problems.push('animalId');
//   if (!LEVELS.includes(level)) problems.push('level');
//   if (lat !== null && !validCoord(lat, -90, 90)) problems.push('lat');
//   if (lng !== null && !validCoord(lng, -180, 180)) problems.push('lng');
//   if ((lat === null) !== (lng === null)) problems.push('lat/lng must be given together');
//   if (gpsAgeMs !== null && !Number.isInteger(gpsAgeMs)) problems.push('gpsAgeMs');
//   if (!Number.isInteger(ageMs) || ageMs < 0 || ageMs > MAX_EVENT_AGE_MS) problems.push('ageMs');
//   if (!isNil(body.eventId) && (typeof body.eventId !== 'string' || body.eventId.length > 40)) problems.push('eventId');

//   if (problems.length) {
//     console.warn(`[ALERT REJECTED] invalid: ${problems.join(', ')}`, JSON.stringify(body).slice(0, 300));
//     return res.status(400).json({ error: 'invalid_alert_payload', fields: problems });
//   }

//   if (body.eventId) {
//     const duplicate = alertModel.findByEvent(poleId, body.eventId);
//     if (duplicate) {
//       return res.status(200).json({ status: 'duplicate', alert: withLink(duplicate) });
//     }
//   }

//   let gpsSource = typeof body.gpsSource === 'string' ? body.gpsSource.slice(0, 16) : null;
//   let outLat = lat;
//   let outLng = lng;

//   if (outLat === null) {
//     const pole = poleModel.getPole(poleId);
//     if (pole && pole.lat != null) {
//       outLat = pole.lat;
//       outLng = pole.lng;
//       gpsSource = 'pole-registry';
//     } else {
//       gpsSource = 'none';
//     }
//   }

//   const alert = {
//     poleId,
//     animalId,
//     level,
//     lat: outLat,
//     lng: outLng,
//     gpsAgeMs,
//     gpsSource,
//     via: typeof body.via === 'string' ? body.via.slice(0, 8) : null,
//     eventId: body.eventId || null,
//     time: new Date(Date.now() - ageMs).toISOString()
//   };

//   const info = alertModel.insertAlert(alert);
//   const saved = withLink({
//     ...alert,
//     id: Number(info.lastInsertRowid),
//     ackedAt: null
//   });

//   emitEvent('animal-alert', saved);
//   console.log(`[ALERT] ${level} pole=${poleId} animal=${animalId} gps=${gpsSource}`);
//   return res.status(201).json({ status: 'received', alert: saved });
// }

// function listAlerts(req, res) {
//   const limit = Math.min(5000, Math.max(1, Number(req.query.limit) || 100));
//   const offset = Math.max(0, Number(req.query.offset) || 0);
//   const where = [];
//   const params = [];

//   if (LEVELS.includes(req.query.level)) {
//     where.push('level = ?');
//     params.push(req.query.level);
//   }
//   if (req.query.poleId) {
//     where.push('poleId = ?');
//     params.push(String(req.query.poleId));
//   }
//   if (req.query.animalId !== undefined && req.query.animalId !== '') {
//     where.push('animalId = ?');
//     params.push(Number(req.query.animalId));
//   }
//   if (Number(req.query.sinceHours) > 0) {
//     where.push('time >= ?');
//     params.push(new Date(Date.now() - Number(req.query.sinceHours) * 3600e3).toISOString());
//   }
//   if (req.query.unacked === '1') where.push("ackedAt IS NULL AND level != 'TEST_ALERT'");
//   if (req.query.hideTests === '1') where.push("level != 'TEST_ALERT'");

//   const { total, rows } = alertModel.listAlerts({ where, params, limit, offset });
//   res.set('X-Total-Count', String(total));
//   return res.json(rows.map(withLink));
// }

// function getStats(req, res) {
//   const hours = Math.min(720, Math.max(1, Number(req.query.hours) || 24));
//   const since = new Date(Date.now() - hours * 3600e3).toISOString();
//   const rows = alertModel.getStatsRows(since);

//   const bucketMs = hours <= 48 ? 3600e3 : 24 * 3600e3;
//   const count = Math.ceil((Date.now() - new Date(since).getTime()) / bucketMs);
//   const start = Date.now() - count * bucketMs;
//   const buckets = Array.from({ length: count }, (_, index) => ({
//     t: new Date(start + index * bucketMs).toISOString(),
//     near: 0,
//     emergency: 0
//   }));

//   let emergencies = 0;
//   for (const row of rows) {
//     const index = Math.min(
//       count - 1,
//       Math.max(0, Math.floor((new Date(row.time).getTime() - start) / bucketMs))
//     );
//     if (row.level === EMERGENCY) {
//       buckets[index].emergency++;
//       emergencies++;
//     } else {
//       buckets[index].near++;
//     }
//   }

//   const byAnimal = alertModel.getStatsByAnimal(since, EMERGENCY);
//   const byPole = alertModel.getStatsByPole(since, EMERGENCY);
//   const unacked = alertModel.countUnacked();
//   const active = alertModel.getActiveEmergencies(
//     EMERGENCY,
//     new Date(Date.now() - 10 * 60e3).toISOString()
//   ).map(withLink);

//   return res.json({
//     hours,
//     bucketMs,
//     total: rows.length,
//     emergencies,
//     near: rows.length - emergencies,
//     unacked,
//     buckets,
//     byAnimal,
//     byPole,
//     activeEmergencies: active
//   });
// }

// function acknowledgeAlert(req, res) {
//   const id = Number(req.params.id);
//   const info = alertModel.acknowledgeAlert(id, new Date().toISOString());
//   const row = alertModel.getAlertById(id);

//   if (!row) return res.status(404).json({ error: 'not_found' });

//   const alert = withLink(row);
//   emitEvent('alert-updated', alert);
//   return res.json({ changed: info.changes, alert });
// }

// function deleteAlert(req, res) {
//   const id = Number(req.params.id);
//   if (!Number.isSafeInteger(id) || id < 1) {
//     return res.status(400).json({ error: 'invalid_alert_id' });
//   }

//   const existing = alertModel.getAlertById(id);
//   if (!existing) return res.status(404).json({ error: 'not_found' });

//   alertModel.deleteAlert(id);
//   emitEvent('alert-deleted', { id });
//   return res.json({ deleted: true, id });
// }

// function acknowledgeAll(req, res) {
//   const poleId = typeof req.body?.poleId === 'string' ? req.body.poleId : null;
//   const info = alertModel.acknowledgeAll(poleId, new Date().toISOString());
//   emitEvent('alerts-bulk-updated', { changed: info.changes });
//   return res.json({ changed: info.changes });
// }

// function checkDanger(req, res) {
//   const { lat, lng, radiusKm = 5 } = req.body || {};
//   if (
//     !validCoord(lat, -90, 90) ||
//     !validCoord(lng, -180, 180) ||
//     typeof radiusKm !== 'number' ||
//     radiusKm < 0.1 ||
//     radiusKm > 50
//   ) {
//     return res.status(400).json({ error: 'invalid_location_or_radius' });
//   }

//   const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
//   const candidates = alertModel.getRecentEmergencies(EMERGENCY, cutoff);
//   const nearby = candidates
//     .map((alert) => ({
//       ...withLink(alert),
//       distanceKm: Number(distanceKm(lat, lng, alert.lat, alert.lng).toFixed(2))
//     }))
//     .filter((alert) => alert.distanceKm <= radiusKm);

//   return res.json({
//     danger: nearby.length > 0,
//     message: nearby.length
//       ? 'Warning: animal reported nearby. Slow down safely.'
//       : 'No active animal found nearby.',
//     alerts: nearby
//   });
// }

// module.exports = {
//   createAlert,
//   listAlerts,
//   getStats,
//   acknowledgeAlert,
//   deleteAlert,
//   acknowledgeAll,
//   checkDanger
// };







const { LEVELS, EMERGENCY, MAX_EVENT_AGE_MS } = require('../config/env');
const NEAR_ROAD = 'ANIMAL_NEAR_ROAD';
const { validCoord, isNil } = require('../utils/validation');
const { withLink, distanceKm } = require('../utils/alertUtils');
const { poleView } = require('../utils/poleUtils');
const alertModel = require('../models/alertModel');
const poleModel = require('../models/poleModel');
const { emitEvent } = require('../services/realtimeService');

function createAlert(req, res) {
  const body = req.body || {};
  const { poleId, animalId, level } = body;
  const lat = isNil(body.lat) ? null : body.lat;
  const lng = isNil(body.lng) ? null : body.lng;
  const gpsAgeMs = isNil(body.gpsAgeMs) ? null : body.gpsAgeMs;
  const ageMs = isNil(body.ageMs) ? 0 : body.ageMs;
  const isTest = level === 'TEST_ALERT';

  const problems = [];
  if (typeof poleId !== 'string' || poleId.length < 1 || poleId.length > 80) problems.push('poleId');
  if (!Number.isInteger(animalId) || animalId < (isTest ? 0 : 1) || animalId > 255) problems.push('animalId');
  if (!LEVELS.includes(level)) problems.push('level');
  if (lat !== null && !validCoord(lat, -90, 90)) problems.push('lat');
  if (lng !== null && !validCoord(lng, -180, 180)) problems.push('lng');
  if ((lat === null) !== (lng === null)) problems.push('lat/lng must be given together');
  if (gpsAgeMs !== null && !Number.isInteger(gpsAgeMs)) problems.push('gpsAgeMs');
  if (!Number.isInteger(ageMs) || ageMs < 0 || ageMs > MAX_EVENT_AGE_MS) problems.push('ageMs');
  if (!isNil(body.eventId) && (typeof body.eventId !== 'string' || body.eventId.length > 40)) problems.push('eventId');

  if (problems.length) {
    console.warn(`[ALERT REJECTED] invalid: ${problems.join(', ')}`, JSON.stringify(body).slice(0, 300));
    return res.status(400).json({ error: 'invalid_alert_payload', fields: problems });
  }

  if (body.eventId) {
    const duplicate = alertModel.findByEvent(poleId, body.eventId);
    if (duplicate) {
      return res.status(200).json({ status: 'duplicate', alert: withLink(duplicate) });
    }
  }

  let gpsSource = typeof body.gpsSource === 'string' ? body.gpsSource.slice(0, 16) : null;
  let outLat = lat;
  let outLng = lng;

  if (outLat === null) {
    const pole = poleModel.getPole(poleId);
    if (pole && pole.lat != null) {
      outLat = pole.lat;
      outLng = pole.lng;
      gpsSource = 'pole-registry';
    } else {
      gpsSource = 'none';
    }
  }

  const alert = {
    poleId,
    animalId,
    level,
    lat: outLat,
    lng: outLng,
    gpsAgeMs,
    gpsSource,
    via: typeof body.via === 'string' ? body.via.slice(0, 8) : null,
    eventId: body.eventId || null,
    time: new Date(Date.now() - ageMs).toISOString()
  };

  const info = alertModel.insertAlert(alert);
  const saved = withLink({
    ...alert,
    id: Number(info.lastInsertRowid),
    ackedAt: null
  });

  emitEvent('animal-alert', saved);
  console.log(`[ALERT] ${level} pole=${poleId} animal=${animalId} gps=${gpsSource}`);
  return res.status(201).json({ status: 'received', alert: saved });
}

function listAlerts(req, res) {
  const limit = Math.min(5000, Math.max(1, Number(req.query.limit) || 100));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const where = [];
  const params = [];

  if (LEVELS.includes(req.query.level)) {
    where.push('level = ?');
    params.push(req.query.level);
  }
  if (req.query.poleId) {
    where.push('poleId = ?');
    params.push(String(req.query.poleId));
  }
  if (req.query.animalId !== undefined && req.query.animalId !== '') {
    where.push('animalId = ?');
    params.push(Number(req.query.animalId));
  }
  if (Number(req.query.sinceHours) > 0) {
    where.push('time >= ?');
    params.push(new Date(Date.now() - Number(req.query.sinceHours) * 3600e3).toISOString());
  }
  if (req.query.unacked === '1') where.push("ackedAt IS NULL AND level != 'TEST_ALERT'");
  if (req.query.hideTests === '1') where.push("level != 'TEST_ALERT'");

  const { total, rows } = alertModel.listAlerts({ where, params, limit, offset });
  res.set('X-Total-Count', String(total));
  return res.json(rows.map(withLink));
}

function getStats(req, res) {
  const hours = Math.min(720, Math.max(1, Number(req.query.hours) || 24));
  const since = new Date(Date.now() - hours * 3600e3).toISOString();
  const rows = alertModel.getStatsRows(since);

  const bucketMs = hours <= 48 ? 3600e3 : 24 * 3600e3;
  const count = Math.ceil((Date.now() - new Date(since).getTime()) / bucketMs);
  const start = Date.now() - count * bucketMs;
  const buckets = Array.from({ length: count }, (_, index) => ({
    t: new Date(start + index * bucketMs).toISOString(),
    near: 0,
    emergency: 0
  }));

  let emergencies = 0;
  for (const row of rows) {
    const index = Math.min(
      count - 1,
      Math.max(0, Math.floor((new Date(row.time).getTime() - start) / bucketMs))
    );
    if (row.level === EMERGENCY) {
      buckets[index].emergency++;
      emergencies++;
    } else {
      buckets[index].near++;
    }
  }

  const byAnimal = alertModel.getStatsByAnimal(since, EMERGENCY);
  const byPole = alertModel.getStatsByPole(since, EMERGENCY);
  const unacked = alertModel.countUnacked();
  const active = alertModel.getActiveEmergencies(
    EMERGENCY,
    new Date(Date.now() - 10 * 60e3).toISOString()
  ).map(withLink);

  return res.json({
    hours,
    bucketMs,
    total: rows.length,
    emergencies,
    near: rows.length - emergencies,
    unacked,
    buckets,
    byAnimal,
    byPole,
    activeEmergencies: active
  });
}

function acknowledgeAlert(req, res) {
  const id = Number(req.params.id);
  const info = alertModel.acknowledgeAlert(id, new Date().toISOString());
  const row = alertModel.getAlertById(id);

  if (!row) return res.status(404).json({ error: 'not_found' });

  const alert = withLink(row);
  emitEvent('alert-updated', alert);
  return res.json({ changed: info.changes, alert });
}

function deleteAlert(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: 'invalid_alert_id' });
  }

  const existing = alertModel.getAlertById(id);
  if (!existing) return res.status(404).json({ error: 'not_found' });

  alertModel.deleteAlert(id);
  emitEvent('alert-deleted', { id });
  return res.json({ deleted: true, id });
}

function acknowledgeAll(req, res) {
  const poleId = typeof req.body?.poleId === 'string' ? req.body.poleId : null;
  const info = alertModel.acknowledgeAll(poleId, new Date().toISOString());
  emitEvent('alerts-bulk-updated', { changed: info.changes });
  return res.json({ changed: info.changes });
}

function checkDanger(req, res) {
  const { lat, lng, radiusKm = 5 } = req.body || {};
  if (
    !validCoord(lat, -90, 90) ||
    !validCoord(lng, -180, 180) ||
    typeof radiusKm !== 'number' ||
    radiusKm < 0.1 ||
    radiusKm > 50
  ) {
    return res.status(400).json({ error: 'invalid_location_or_radius' });
  }

  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const candidates = alertModel.getRecentRoadAlerts(NEAR_ROAD, EMERGENCY, cutoff);
  const nearby = candidates
    .map((alert) => ({
      ...withLink(alert),
      distanceKm: Number(distanceKm(lat, lng, alert.lat, alert.lng).toFixed(2))
    }))
    .filter((alert) => alert.distanceKm <= radiusKm);

  return res.json({
    danger: nearby.length > 0,
    message: nearby.length
      ? 'Warning: animal reported nearby. Slow down safely.'
      : 'No active animal found nearby.',
    alerts: nearby
  });
}

module.exports = {
  createAlert,
  listAlerts,
  getStats,
  acknowledgeAlert,
  deleteAlert,
  acknowledgeAll,
  checkDanger
};
