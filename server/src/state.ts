import { GameState } from "shared";
import { GameError } from "./domain/errors.js";

const rooms = new Map<string, { game: GameState; createdAt: number }>();
const playerRooms = new Map<string, string>();
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const MAX_ROOMS = 100;

export function getRoom(roomCode: string): GameState {
  const entry = rooms.get(roomCode);
  if (!entry) {
    throw new GameError("Room not found");
  }
  return entry.game;
}

export function setRoom(roomCode: string, game: GameState): void {
  const existing = rooms.get(roomCode);
  if (existing) {
    existing.game = game;
  } else {
    rooms.set(roomCode, { game, createdAt: Date.now() });
  }
}

export function deleteRoom(roomCode: string): void {
  rooms.delete(roomCode);
}

export function getPlayerRoom(playerId: string): string | null {
  return playerRooms.get(playerId) ?? null;
}

export function setPlayerRoom(playerId: string, roomCode: string): void {
  playerRooms.set(playerId, roomCode);
}

export function removePlayerRoom(playerId: string): void {
  playerRooms.delete(playerId);
}

export function setDisconnectTimer(
  playerId: string,
  timer: ReturnType<typeof setTimeout>
): void {
  disconnectTimers.set(playerId, timer);
}

export function clearDisconnectTimer(playerId: string): void {
  const timer = disconnectTimers.get(playerId);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(playerId);
  }
}

export function getExpiredRooms(maxAgeMs: number): string[] {
  const now = Date.now();
  const expired: string[] = [];
  for (const [code, entry] of rooms) {
    if (now - entry.createdAt > maxAgeMs) {
      expired.push(code);
    }
  }
  return expired;
}

export function isRoomLimitReached(): boolean {
  return rooms.size >= MAX_ROOMS;
}

export function getPlayerRoomEntries(): IterableIterator<[string, string]> {
  return playerRooms.entries();
}
