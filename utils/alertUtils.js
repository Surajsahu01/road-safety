function mapLink(alert) {
  return alert.lat != null && alert.lng != null
    ? `https://www.google.com/maps?q=${alert.lat},${alert.lng}`
    : null;
}

function withLink(alert) {
  return { ...alert, mapLink: mapLink(alert) };
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const rad = (degrees) => degrees * Math.PI / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) *
      Math.cos(rad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { mapLink, withLink, distanceKm };
