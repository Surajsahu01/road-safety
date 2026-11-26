const poleModel = require('../models/poleModel');
const { validCoord } = require('../utils/validation');
const { poleView } = require('../utils/poleUtils');
const { emitEvent, getLastOnline } = require('../services/realtimeService');

function reportPoleStatus(req, res) {
  const body = req.body || {};
  const num = (value, fallback = 0) => Number.isFinite(value) ? Math.trunc(value) : fallback;

  if (typeof body.poleId !== 'string' || !body.poleId || body.poleId.length > 80) {
    return res.status(400).json({ error: 'invalid_pole_status' });
  }

  const hasPosition = validCoord(body.lat, -90, 90) && validCoord(body.lng, -180, 180);
  poleModel.upsertPole({
    poleId: body.poleId,
    lat: hasPosition ? body.lat : null,
    lng: hasPosition ? body.lng : null,
    gpsFix: body.gpsFix ? 1 : 0,
    sats: num(body.sats),
    signal: num(body.signal),
    via: typeof body.via === 'string' ? body.via.slice(0, 8) : null,
    uptimeS: num(body.uptimeS),
    sent: num(body.sent),
    failed: num(body.failed),
    lastResult: typeof body.lastResult === 'string' ? body.lastResult.slice(0, 160) : null,
    periodSec: num(body.periodSec, 120),
    fw: typeof body.fw === 'string' ? body.fw.slice(0, 16) : null,
    now: new Date().toISOString()
  });

  const pole = poleView(poleModel.getPole(body.poleId));
  getLastOnline().set(pole.poleId, true);
  emitEvent('pole-status', pole);
  return res.json({ status: 'ok' });
}

function listPoles(_req, res) {
  return res.json(poleModel.listPoles().map(poleView));
}

module.exports = { reportPoleStatus, listPoles };
