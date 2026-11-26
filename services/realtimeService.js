let ioInstance = null;
const lastOnline = new Map();

function setIO(io) {
  ioInstance = io;
}

function emitEvent(eventName, payload) {
  if (ioInstance) ioInstance.emit(eventName, payload);
}

function emitToRoom(room, eventName, payload) {
  if (ioInstance) ioInstance.to(room).emit(eventName, payload);
}

function getLastOnline() {
  return lastOnline;
}

module.exports = { setIO, emitEvent, emitToRoom, getLastOnline };
