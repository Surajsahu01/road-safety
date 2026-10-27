const Database = require('better-sqlite3');

const db = new Database(process.env.DB_PATH || 'alerts.sqlite');
db.pragma('journal_mode = WAL');

// Migrate the previous schema if it had required GPS coordinates or no eventId.
const oldCols = db.prepare('PRAGMA table_info(alerts)').all();
if (
  oldCols.length &&
  (oldCols.find((column) => column.name === 'lat')?.notnull ||
    !oldCols.find((column) => column.name === 'eventId'))
) {
  db.exec('ALTER TABLE alerts RENAME TO alerts_old');
  console.log('[DB] migrating old alerts table');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poleId TEXT NOT NULL,
    animalId INTEGER NOT NULL,
    level TEXT NOT NULL,
    lat REAL,
    lng REAL,
    gpsAgeMs INTEGER,
    gpsSource TEXT,
    via TEXT,
    eventId TEXT,
    time TEXT NOT NULL,
    ackedAt TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_alerts_time ON alerts(time);
  CREATE INDEX IF NOT EXISTS idx_alerts_pole ON alerts(poleId);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_event
    ON alerts(poleId, eventId) WHERE eventId IS NOT NULL;

  CREATE TABLE IF NOT EXISTS poles (
    poleId TEXT PRIMARY KEY,
    lat REAL,
    lng REAL,
    gpsFix INTEGER,
    sats INTEGER,
    signal INTEGER,
    via TEXT,
    uptimeS INTEGER,
    sent INTEGER,
    failed INTEGER,
    lastResult TEXT,
    periodSec INTEGER,
    fw TEXT,
    firstSeen TEXT NOT NULL,
    lastSeen TEXT NOT NULL
  );
`);

if (db.prepare("SELECT name FROM sqlite_master WHERE name = 'alerts_old'").get()) {
  db.exec(`
    INSERT INTO alerts (poleId, animalId, level, lat, lng, gpsAgeMs, time)
    SELECT poleId, animalId, level, lat, lng, gpsAgeMs, time FROM alerts_old;
    DROP TABLE alerts_old;
  `);
}

module.exports = db;
