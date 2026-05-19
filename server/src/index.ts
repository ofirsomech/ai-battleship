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
  const playerId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  socket.data.playerId = playerId;

  const { roomCode, playerId: authPlayerId } = socket.handshake.auth as Record<
    string,
    unknown
  >;

  if (typeof authPlayerId === "string" && authPlayerId.length > 0) {
    socket.data.playerId = authPlayerId;
  }

  if (typeof roomCode === "string" && roomCode.length > 0) {
    socket.data.roomCode = roomCode;
  }

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
