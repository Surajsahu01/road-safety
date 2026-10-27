const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const DEVICE_API_KEY = process.env.DEVICE_API_KEY || 'CHANGE_THIS_DEVICE_KEY';
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const ORIGINS = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigin = ORIGINS.includes('*') ? true : ORIGINS;

const LEVELS = [
  'ANIMAL_NEAR_ROAD',
  'ANIMAL_ON_ROAD_EMERGENCY',
  'ANIMAL_LEFT',
  'TEST_ALERT'
];
const EMERGENCY = 'ANIMAL_ON_ROAD_EMERGENCY';
const MAX_EVENT_AGE_MS = 24 * 3600 * 1000;

module.exports = {
  PORT,
  HOST,
  DEVICE_API_KEY,
  ADMIN_KEY,
  corsOrigin,
  LEVELS,
  EMERGENCY,
  MAX_EVENT_AGE_MS
};
