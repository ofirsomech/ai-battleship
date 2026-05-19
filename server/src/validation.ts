import { GameError } from "./domain/errors.js";
import { Ship } from "shared";

export function validateRoomCode(code: unknown): string {
  if (typeof code !== "string" || !/^[A-Z]{4}$/.test(code)) {
    throw new GameError("Invalid room code");
  }
  return code;
}

export function validatePlayerName(name: unknown): string {
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new GameError("Player name is required");
  }
  const trimmed = name.trim();
  if (trimmed.length > 20) {
    throw new GameError("Player name must be 20 characters or fewer");
  }
  return trimmed;
}

export function validatePlayerId(id: unknown): string {
  if (typeof id !== "string" || id.length === 0) {
    throw new GameError("Invalid player");
  }
  return id;
}

export function validateCoordinate(val: unknown): number {
  if (typeof val !== "number" || !Number.isInteger(val) || val < 0 || val > 9) {
    throw new GameError("Invalid coordinate");
  }
  return val;
}

export function validateShipPlacement(payload: unknown): {
  roomCode: string;
  ships: Ship[];
} {
  if (!payload || typeof payload !== "object") {
    throw new GameError("Invalid payload");
  }
  const { roomCode, ships } = payload as Record<string, unknown>;
  const code = validateRoomCode(roomCode);
  if (!Array.isArray(ships) || ships.length !== 5) {
    throw new GameError("Invalid ship data");
  }
  for (const ship of ships) {
    if (!ship || typeof ship !== "object") {
      throw new GameError("Invalid ship data");
    }
    const s = ship as Record<string, unknown>;
    if (
      typeof s.id !== "string" ||
      typeof s.type !== "string" ||
      typeof s.size !== "number" ||
      !Array.isArray(s.position)
    ) {
      throw new GameError("Invalid ship data");
    }
  }
  return { roomCode: code, ships: ships as Ship[] };
}
