// const db = require('../db/database');

// const insertAlertStatement = db.prepare(`
//   INSERT INTO alerts
//     (poleId, animalId, level, lat, lng, gpsAgeMs, gpsSource, via, eventId, time)
//   VALUES
//     (@poleId, @animalId, @level, @lat, @lng, @gpsAgeMs, @gpsSource, @via, @eventId, @time)
// `);

// const findByEventStatement = db.prepare(
//   'SELECT * FROM alerts WHERE poleId = ? AND eventId = ?'
// );

// function insertAlert(alert) {
//   return insertAlertStatement.run(alert);
// }

// function findByEvent(poleId, eventId) {
//   return findByEventStatement.get(poleId, eventId);
// }

// function getAlertById(id) {
//   return db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
// }

// function listAlerts({ where, params, limit, offset }) {
//   const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
//   const total = db.prepare(`SELECT COUNT(*) AS count FROM alerts ${clause}`).get(...params).count;
//   const rows = db.prepare(`
//     SELECT * FROM alerts ${clause}
//     ORDER BY time DESC, id DESC LIMIT ? OFFSET ?
//   `).all(...params, limit, offset);

//   return { total, rows };
// }

// function acknowledgeAlert(id, time) {
//   return db.prepare(
//     'UPDATE alerts SET ackedAt = ? WHERE id = ? AND ackedAt IS NULL'
//   ).run(time, id);
// }

// function deleteAlert(id) {
//   return db.prepare('DELETE FROM alerts WHERE id = ?').run(id);
// }

// function acknowledgeAll(poleId, time) {
//   return poleId
//     ? db.prepare('UPDATE alerts SET ackedAt = ? WHERE ackedAt IS NULL AND poleId = ?').run(time, poleId)
//     : db.prepare('UPDATE alerts SET ackedAt = ? WHERE ackedAt IS NULL').run(time);
// }

// function getStatsRows(since) {
//   return db.prepare(`
//     SELECT time, level, poleId, animalId
//     FROM alerts WHERE time >= ? AND level != 'TEST_ALERT'
//   `).all(since);
// }

// function getStatsByAnimal(since, emergencyLevel) {
//   return db.prepare(`
//     SELECT animalId, COUNT(*) total,
//       SUM(level = ?) emergencies, MAX(time) lastSeen,
//       (SELECT poleId FROM alerts a2
//        WHERE a2.animalId = a.animalId AND a2.level != 'TEST_ALERT'
//        ORDER BY a2.time DESC LIMIT 1) lastPole
//     FROM alerts a
//     WHERE time >= ? AND level != 'TEST_ALERT' AND animalId > 0
//     GROUP BY animalId ORDER BY total DESC LIMIT 10
//   `).all(emergencyLevel, since);
// }

// function getStatsByPole(since, emergencyLevel) {
//   return db.prepare(`
//     SELECT poleId, COUNT(*) total,
//       SUM(level = ?) emergencies
//     FROM alerts WHERE time >= ? AND level != 'TEST_ALERT'
//     GROUP BY poleId ORDER BY total DESC LIMIT 10
//   `).all(emergencyLevel, since);
// }

// function countUnacked() {
//   return db.prepare(
//     "SELECT COUNT(*) AS count FROM alerts WHERE ackedAt IS NULL AND level != 'TEST_ALERT'"
//   ).get().count;
// }

// function getActiveEmergencies(emergencyLevel, since) {
//   return db.prepare(`
//     SELECT * FROM alerts
//     WHERE level = ? AND ackedAt IS NULL AND time >= ?
//     ORDER BY time DESC
//   `).all(emergencyLevel, since);
// }

// function getRecentEmergencies(emergencyLevel, cutoff) {
//   return db.prepare(`
//     SELECT * FROM alerts
//     WHERE level = ? AND lat IS NOT NULL AND time >= ?
//     ORDER BY id DESC LIMIT 500
//   `).all(emergencyLevel, cutoff);
// }

// module.exports = {
//   insertAlert,
//   findByEvent,
//   getAlertById,
//   listAlerts,
//   acknowledgeAlert,
//   deleteAlert,
//   acknowledgeAll,
//   getStatsRows,
//   getStatsByAnimal,
//   getStatsByPole,
//   countUnacked,
//   getActiveEmergencies,
//   getRecentEmergencies
// };






const db = require('../db/database');

const insertAlertStatement = db.prepare(`
  INSERT INTO alerts
    (poleId, animalId, level, lat, lng, gpsAgeMs, gpsSource, via, eventId, time)
  VALUES
    (@poleId, @animalId, @level, @lat, @lng, @gpsAgeMs, @gpsSource, @via, @eventId, @time)
`);

const findByEventStatement = db.prepare(
  'SELECT * FROM alerts WHERE poleId = ? AND eventId = ?'
);

function insertAlert(alert) {
  return insertAlertStatement.run(alert);
}

function findByEvent(poleId, eventId) {
  return findByEventStatement.get(poleId, eventId);
}

function getAlertById(id) {
  return db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
}

function listAlerts({ where, params, limit, offset }) {
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS count FROM alerts ${clause}`).get(...params).count;
  const rows = db.prepare(`
    SELECT * FROM alerts ${clause}
    ORDER BY time DESC, id DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  return { total, rows };
}

function acknowledgeAlert(id, time) {
  return db.prepare(
    'UPDATE alerts SET ackedAt = ? WHERE id = ? AND ackedAt IS NULL'
  ).run(time, id);
}

function deleteAlert(id) {
  return db.prepare('DELETE FROM alerts WHERE id = ?').run(id);
}

function acknowledgeAll(poleId, time) {
  return poleId
    ? db.prepare('UPDATE alerts SET ackedAt = ? WHERE ackedAt IS NULL AND poleId = ?').run(time, poleId)
    : db.prepare('UPDATE alerts SET ackedAt = ? WHERE ackedAt IS NULL').run(time);
}

function getStatsRows(since) {
  return db.prepare(`
    SELECT time, level, poleId, animalId
    FROM alerts WHERE time >= ? AND level != 'TEST_ALERT'
  `).all(since);
}

function getStatsByAnimal(since, emergencyLevel) {
  return db.prepare(`
    SELECT animalId, COUNT(*) total,
      SUM(level = ?) emergencies, MAX(time) lastSeen,
      (SELECT poleId FROM alerts a2
       WHERE a2.animalId = a.animalId AND a2.level != 'TEST_ALERT'
       ORDER BY a2.time DESC LIMIT 1) lastPole
    FROM alerts a
    WHERE time >= ? AND level != 'TEST_ALERT' AND animalId > 0
    GROUP BY animalId ORDER BY total DESC LIMIT 10
  `).all(emergencyLevel, since);
}

function getStatsByPole(since, emergencyLevel) {
  return db.prepare(`
    SELECT poleId, COUNT(*) total,
      SUM(level = ?) emergencies
    FROM alerts WHERE time >= ? AND level != 'TEST_ALERT'
    GROUP BY poleId ORDER BY total DESC LIMIT 10
  `).all(emergencyLevel, since);
}

function countUnacked() {
  return db.prepare(
    "SELECT COUNT(*) AS count FROM alerts WHERE ackedAt IS NULL AND level != 'TEST_ALERT'"
  ).get().count;
}

function getActiveEmergencies(emergencyLevel, since) {
  return db.prepare(`
    SELECT * FROM alerts
    WHERE level = ? AND ackedAt IS NULL AND time >= ?
    ORDER BY time DESC
  `).all(emergencyLevel, since);
}

function getRecentRoadAlerts(nearRoadLevel, emergencyLevel, cutoff) {
  // The driver app must receive both early warnings and escalated emergencies.
  // Require both coordinates so distance calculations cannot produce NaN.
  return db.prepare(`
    SELECT * FROM alerts
    WHERE level IN (?, ?)
      AND lat IS NOT NULL AND lng IS NOT NULL
      AND time >= ?
    ORDER BY time DESC, id DESC LIMIT 500
  `).all(nearRoadLevel, emergencyLevel, cutoff);
}

module.exports = {
  insertAlert,
  findByEvent,
  getAlertById,
  listAlerts,
  acknowledgeAlert,
  deleteAlert,
  acknowledgeAll,
  getStatsRows,
  getStatsByAnimal,
  getStatsByPole,
  countUnacked,
  getActiveEmergencies,
  getRecentRoadAlerts
};
