const validCoord = (value, min, max) =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;

const isNil = (value) => value === null || value === undefined;

module.exports = { validCoord, isNil };
