const db = require('../db/database');

const getPoleStatement = db.prepare('SELECT * FROM poles WHERE poleId = ?');

const upsertPoleStatement = db.prepare(`
  INSERT INTO poles
    (poleId, lat, lng, gpsFix, sats, signal, via, uptimeS, sent, failed,
     lastResult, periodSec, fw, firstSeen, lastSeen)
  VALUES
    (@poleId, @lat, @lng, @gpsFix, @sats, @signal, @via, @uptimeS, @sent,
     @failed, @lastResult, @periodSec, @fw, @now, @now)
  ON CONFLICT(poleId) DO UPDATE SET
    lat = COALESCE(@lat, lat),
    lng = COALESCE(@lng, lng),
    gpsFix = @gpsFix,
    sats = @sats,
    signal = @signal,
    via = @via,
    uptimeS = @uptimeS,
    sent = @sent,
    failed = @failed,
    lastResult = @lastResult,
    periodSec = @periodSec,
    fw = @fw,
    lastSeen = @now
`);

function getPole(poleId) {
  return getPoleStatement.get(poleId);
}

function upsertPole(pole) {
  return upsertPoleStatement.run(pole);
}

function listPoles() {
  return db.prepare('SELECT * FROM poles ORDER BY poleId').all();
}

function getAllPoles() {
  return db.prepare('SELECT * FROM poles').all();
}

module.exports = { getPole, upsertPole, listPoles, getAllPoles };
