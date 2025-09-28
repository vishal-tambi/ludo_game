const GameRoom = require("./gameRoom");

class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // { roomId -> GameRoom }
  }

  getOrCreate(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new GameRoom(roomId, this.io));
    }
    return this.rooms.get(roomId);
  }

  get(roomId) {
    return this.rooms.get(roomId);
  }

  removePlayer(socketId) {
    for (let room of this.rooms.values()) {
      room.removePlayer(socketId);
    }
  }
}

module.exports = RoomManager;
