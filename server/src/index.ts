import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { registerHandlers } from "./handlers/index.js";
import { getExpiredRooms, deleteRoom, removePlayerRoom, clearDisconnectTimer, getPlayerRoomEntries } from "./state.js";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  const { roomCode, playerId } = socket.handshake.auth as Record<
    string,
    unknown
  >;

  if (typeof roomCode !== "string" || roomCode.length === 0) {
    return next(new Error("Room code is required"));
  }
  if (!/^[A-Z]{4}$/.test(roomCode)) {
    return next(new Error("Invalid room code"));
  }
  if (typeof playerId !== "string" || playerId.length === 0) {
    return next(new Error("Player ID is required"));
  }

  socket.data.roomCode = roomCode;
  socket.data.playerId = playerId;
  next();
});

registerHandlers(io);

setInterval(() => {
  const expired = getExpiredRooms(30 * 60 * 1000);
  for (const code of expired) {
    try {
      for (const [pId, rCode] of [...getPlayerRoomEntries()]) {
        if (rCode === code) {
          removePlayerRoom(pId);
          clearDisconnectTimer(pId);
        }
      }
      deleteRoom(code);
    } catch {
      // room already removed
    }
  }
}, 60_000);

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
