const { applyProgress, applyCapture } = require("./utils/scoreUtils");

class GameRoom {
  constructor(roomId, io) {
    this.roomId = roomId;
    this.io = io;
    this.players = {}; // { playerId: { id, name, captures, pawns: [] } }
    this.pawns = {};   // { pawnId: { id, ownerId, pos, score } }
    this.playerScores = {}; // { playerId: totalScore }
    this.currentPlayer = null; // Current player's turn
    this.started = false; // Game started flag
    this.playerOrder = []; // Order of players for turns
    this.diceValue = 0; // Current dice value
  }

  addPlayer(socket, { playerId, name }) {
    console.log(`Player ${playerId} trying to join room ${this.roomId}`);
    console.log(`Current players:`, Object.keys(this.players));
    console.log(`Player order:`, this.playerOrder);
    console.log(`Game started:`, this.started);

    if (!this.players[playerId]) {
      this.players[playerId] = {
        id: playerId,
        name,
        captures: 0,
        pawns: [
          { position: "home" },
          { position: "home" },
          { position: "home" },
          { position: "home" }
        ]
      };

      this.playerScores[playerId] = 0;
      this.playerOrder.push(playerId);

      console.log(`Player ${playerId} added successfully. Total players: ${this.playerOrder.length}`);
      console.log(`Updated player order:`, this.playerOrder);

      // Auto-start game with 2+ players
      if (this.playerOrder.length >= 2 && !this.started) {
        console.log(`Starting game with ${this.playerOrder.length} players...`);
        this.startGame();
      } else {
        console.log(`Not starting game yet. Players: ${this.playerOrder.length}, Started: ${this.started}`);
      }
    } else {
      console.log(`Player ${playerId} already exists in room`);
    }
  }

  startGame() {
    this.started = true;
    this.currentPlayer = this.playerOrder[0];
    console.log(`Game started in room ${this.roomId}. Current player: ${this.currentPlayer}`);
    this.broadcastState();
  }

  nextTurn() {
    const currentIndex = this.playerOrder.indexOf(this.currentPlayer);
    const nextIndex = (currentIndex + 1) % this.playerOrder.length;
    this.currentPlayer = this.playerOrder[nextIndex];
    this.diceValue = 0;
    console.log(`Turn switched to: ${this.currentPlayer}`);
    this.broadcastState();
  }

  broadcastState() {
    const state = this.getState();
    this.io.to(this.roomId).emit("game:state", state);
  }

  removePlayer(socketId) {
    // For simplicity, no cleanup here (can be extended later)
  }

  handleDice({ playerId, value }) {
    if (playerId !== this.currentPlayer) {
      return { success: false, reason: "Not your turn" };
    }

    this.diceValue = value;
    console.log(`${playerId} rolled: ${value}`);

    // Broadcast dice result
    this.io.to(this.roomId).emit("game:dice", { playerId, value });

    return { success: true };
  }

  handleMove({ playerId, pawnId, diceValue }) {
    if (playerId !== this.currentPlayer) {
      return { success: false, reason: "Not your turn" };
    }

    if (diceValue !== this.diceValue) {
      return { success: false, reason: "Invalid dice value" };
    }

    // Simple move logic for now
    console.log(`${playerId} moved pawn ${pawnId} with dice ${diceValue}`);

    // Next turn (unless rolled 6)
    if (diceValue !== 6) {
      this.nextTurn();
    } else {
      // Same player gets another turn
      this.diceValue = 0;
      this.broadcastState();
    }

    return { success: true };
  }

  getScores() {
    return {
      playerScores: this.playerScores,
      captures: Object.fromEntries(Object.entries(this.players).map(
        ([id, p]) => [id, p.captures]
      ))
    };
  }

  getState() {
    return {
      players: this.players,
      pawns: this.pawns,
      playerScores: this.playerScores,
      currentPlayer: this.currentPlayer,
      started: this.started,
      diceValue: this.diceValue,
      playerOrder: this.playerOrder
    };
  }
}

module.exports = GameRoom;
