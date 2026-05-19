import {
  CellStatus,
  AttackResult,
  GameState,
  Ship,
  Position,
  GRID_SIZE,
  GamePhase,
  Cell,
  Player,
} from "shared";
import { GameError } from "./errors.js";

export function getOpponentId(game: GameState, playerId: string): string {
  const opponent = game.players.find((p) => p.id !== playerId);
  if (!opponent) {
    throw new GameError("Opponent not found");
  }
  return opponent.id;
}

function findOpponentIndex(game: GameState, attackerId: string): number {
  const idx = game.players.findIndex((p) => p.id !== attackerId);
  if (idx === -1) {
    throw new GameError("Opponent not found");
  }
  return idx;
}

function attackerIndex(game: GameState, attackerId: string): number {
  const idx = game.players.findIndex((p) => p.id === attackerId);
  if (idx === -1) {
    throw new GameError("Attacker not found");
  }
  return idx;
}

function clonePlayers(players: readonly Player[]): Player[] {
  return players.map((p) => ({
    ...p,
    grid: p.grid.map((row) => row.map((cell) => ({ ...cell }))),
    ships: p.ships.map((s) => ({ ...s, hits: [...s.hits], position: s.position.map((pos) => ({ ...pos })) })),
  }));
}

export function processAttack(
  game: GameState,
  attackerId: string,
  row: number,
  col: number
): { gameState: GameState; result: AttackResult } {
  if (game.currentTurn !== attackerId) {
    throw new GameError("Not your turn");
  }

  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
    throw new GameError("Attack coordinates out of bounds");
  }

  const oppIdx = findOpponentIndex(game, attackerId);
  const attIdx = attackerIndex(game, attackerId);

  const players = clonePlayers(game.players);
  const opponent = players[oppIdx];
  const targetCell = opponent.grid[row][col];

  if (targetCell.status === CellStatus.Hit || targetCell.status === CellStatus.Miss) {
    throw new GameError("Cell already attacked");
  }

  let hit = false;
  let shipSunk: Ship["type"] | null = null;

  if (targetCell.status === CellStatus.Occupied) {
    hit = true;
    targetCell.status = CellStatus.Hit;

    const ship = opponent.ships.find((s) => s.id === targetCell.shipId);
    if (ship) {
      const posIndex = ship.position.findIndex(
        (p) => p.row === row && p.col === col
      );
      if (posIndex >= 0) {
        ship.hits[posIndex] = true;
      }
      if (ship.hits.every((h) => h)) {
        ship.sunk = true;
        shipSunk = ship.type;
      }
    }
  } else {
    targetCell.status = CellStatus.Miss;
  }

  const allOpponentShipsSunk = opponent.ships.every((s) => s.sunk);
  const nextTurn = game.players[1 - attIdx].id;

  const newGameState: GameState = {
    ...game,
    players,
    currentTurn: allOpponentShipsSunk ? attackerId : nextTurn,
    phase: allOpponentShipsSunk ? GamePhase.Finished : game.phase,
    winnerId: allOpponentShipsSunk ? attackerId : null,
  };

  const result: AttackResult = {
    hit,
    shipSunk,
    row,
    col,
  };

  return { gameState: newGameState, result };
}
