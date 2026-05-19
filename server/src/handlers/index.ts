import { Server } from "socket.io";
import { registerRoomHandlers } from "./room.js";
import { registerShipHandlers } from "./ship.js";
import { registerAttackHandlers } from "./attack.js";

export function registerHandlers(io: Server): void {
  io.on("connection", (socket) => {
    registerRoomHandlers(io, socket);
    registerShipHandlers(io, socket);
    registerAttackHandlers(io, socket);
  });
}
