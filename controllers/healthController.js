function getHealth(_req, res) {
  res.json({
    ok: true,
    service: 'animal-road-safety',
    time: new Date().toISOString()
  });
}

module.exports = { getHealth };
