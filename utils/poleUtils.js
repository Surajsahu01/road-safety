function poleView(pole) {
  const periodMs = Math.max(30, pole.periodSec || 120) * 1000;
  const age = Date.now() - new Date(pole.lastSeen).getTime();

  return {
    ...pole,
    gpsFix: !!pole.gpsFix,
    online: age < periodMs * 2.5,
    lastSeenAgoMs: age
  };
}

module.exports = { poleView };
