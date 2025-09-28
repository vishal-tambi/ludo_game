const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const RoomManager = require("./rooms");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // allow all origins for dev
});

const rooms = new RoomManager(io);

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("game:join", ({ roomId, playerId, name }) => {
    const room = rooms.getOrCreate(roomId);
    room.addPlayer(socket, { playerId, name });
    socket.join(roomId);

    // Send current state back
    socket.emit("game:state", room.getState());
    io.to(roomId).emit("game:scores", room.getScores());
  });

  socket.on("game:start", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit("error", "Room not found");

    room.startGame();
  });

  socket.on("game:dice", (payload) => {
    const room = rooms.get(payload.roomId);
    if (!room) return socket.emit("error", "Room not found");

    const result = room.handleDice(payload);
    if (!result.success) {
      socket.emit("game:dice:ack", result);
    }
  });

  socket.on("game:move", (payload) => {
    const room = rooms.get(payload.roomId);
    if (!room) return socket.emit("error", "Room not found");

    const result = room.handleMove(payload);
    if (result.success) {
      io.to(payload.roomId).emit("game:scores", room.getScores());
      io.to(payload.roomId).emit("game:state", room.getState());
    } else {
      socket.emit("game:move:ack", result);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    rooms.removePlayer(socket.id);
  });
});

server.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});
