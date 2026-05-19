import {
  CellStatus,
  GameState,
  GamePhase,
  Cell,
  Player,
  GRID_SIZE,
  Ship,
} from "shared";
import { GameError } from "./errors.js";
import { createShips } from "./ship.js";

export function generateRoomCode(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

export function createEmptyGrid(): Cell[][] {
  const grid: Cell[][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    grid[row] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      grid[row][col] = { row, col, status: CellStatus.Empty, shipId: null };
    }
  }
  return grid;
}

function createPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    grid: createEmptyGrid(),
    ships: createShips(),
    isReady: false,
    isConnected: true,
  };
}

export function createRoom(
  roomCode: string,
  playerId: string,
  playerName: string
): GameState {
  return {
    roomCode,
    players: [createPlayer(playerId, playerName)],
    currentTurn: null,
    phase: GamePhase.Lobby,
    winnerId: null,
    disconnectTimer: null,
  };
}

export function joinRoom(
  game: GameState,
  playerId: string,
  playerName: string
): GameState {
  if (game.phase === GamePhase.Finished) {
    throw new GameError("Cannot join a finished game");
  }
  if (game.players.length >= 2) {
    throw new GameError("Room is full");
  }
  return {
    ...game,
    players: [...game.players, createPlayer(playerId, playerName)],
  };
}

export function playerReady(game: GameState, playerId: string): GameState {
  const players = game.players.map((p) =>
    p.id === playerId ? { ...p, isReady: true } : p
  );

  const bothReady = players.length === 2 && players.every((p) => p.isReady);

  return {
    ...game,
    players,
    phase: bothReady ? GamePhase.Playing : game.phase,
    currentTurn: bothReady ? players[0].id : game.currentTurn,
  };
}

export function playerLeave(game: GameState, playerId: string): GameState {
  const remainingPlayers = game.players.filter((p) => p.id !== playerId);

  if (game.phase === GamePhase.Playing && remainingPlayers.length === 1) {
    return {
      ...game,
      players: remainingPlayers,
      phase: GamePhase.Finished,
      winnerId: remainingPlayers[0].id,
    };
  }

  return {
    ...game,
    players: remainingPlayers,
  };
}

export function getPlayerCount(game: GameState): number {
  return game.players.length;
}

export function isRoomFull(game: GameState): boolean {
  return game.players.length >= 2;
}
