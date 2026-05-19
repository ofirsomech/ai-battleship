import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({ autoConnect: false });
  }
  return socket;
}

export function connectSocket(auth?: { roomCode: string; playerId: string }): Socket {
  const s = getSocket();
  if (auth) {
    s.auth = auth;
  }
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
}
