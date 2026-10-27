const poleModel = require('../models/poleModel');
const { poleView } = require('../utils/poleUtils');
const { emitEvent, getLastOnline } = require('../services/realtimeService');

function checkPoleOnlineStatus() {
  const lastOnline = getLastOnline();

  for (const pole of poleModel.getAllPoles().map(poleView)) {
    if (lastOnline.get(pole.poleId) !== pole.online) {
      if (lastOnline.has(pole.poleId) || !pole.online) {
        console.log(`[POLE] ${pole.poleId} is ${pole.online ? 'ONLINE' : 'OFFLINE'}`);
      }
      lastOnline.set(pole.poleId, pole.online);
      emitEvent('pole-status', pole);
    }
  }
}

module.exports = { checkPoleOnlineStatus };
