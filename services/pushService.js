const ownerModel = require('../models/ownerModel');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
let webpush = null;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush = require('web-push');
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn('[WARN] VAPID keys not set: background push disabled (live in-app alerts still work).');
}

async function sendToOwner(ownerId, payload) {
  if (!webpush) return;
  const body = JSON.stringify(payload);
  for (const row of ownerModel.listSubscriptions(ownerId)) {
    try {
      await webpush.sendNotification(JSON.parse(row.subscription), body, { TTL: 600, urgency: 'high' });
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) ownerModel.deleteSubscription(row.endpoint);
      else console.warn('[PUSH] failed:', error.statusCode || error.message);
    }
  }
}

module.exports = { VAPID_PUBLIC_KEY, sendToOwner };
