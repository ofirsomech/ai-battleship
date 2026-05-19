// ── Cell ────────────────────────────────────────────────────────
export enum CellStatus {
  Empty = "empty",
  Occupied = "occupied",
  Hit = "hit",
  Miss = "miss",
}

export interface Cell {
  row: number;
  col: number;
  status: CellStatus;
  shipId: string | null;
}

// ── Ships ───────────────────────────────────────────────────────
export enum ShipType {
  Carrier = "Carrier",
  Battleship = "Battleship",
  Cruiser = "Cruiser",
  Submarine = "Submarine",
  Destroyer = "Destroyer",
}

export type Position = {
  row: number;
  col: number;
};

export interface Ship {
  id: string;
  type: ShipType;
  size: number;
  position: Position[];
  hits: boolean[];
  sunk: boolean;
}

// ── Player ──────────────────────────────────────────────────────
export interface Player {
  id: string;
  name: string;
  grid: Cell[][];
  ships: Ship[];
  isReady: boolean;
  isConnected: boolean;
}

// ── Game state ──────────────────────────────────────────────────
export enum GamePhase {
  Lobby = "Lobby",
  Placement = "Placement",
  Playing = "Playing",
  Finished = "Finished",
}

export interface GameState {
  roomCode: string;
  players: Player[];
  currentTurn: string | null; // playerId
  phase: GamePhase;
  winnerId: string | null;
  disconnectTimer: number | null; // seconds remaining
}

// ── Events payloads ─────────────────────────────────────────────
export interface AttackResult {
  hit: boolean;
  shipSunk: ShipType | null;
  row: number;
  col: number;
}

export interface RoomInfo {
  code: string;
  playerCount: number;
  phase: GamePhase;
}

// ── Validation helpers ──────────────────────────────────────────
export const SHIP_SIZES: Record<ShipType, number> = {
  [ShipType.Carrier]: 5,
  [ShipType.Battleship]: 4,
  [ShipType.Cruiser]: 3,
  [ShipType.Submarine]: 3,
  [ShipType.Destroyer]: 2,
};

export const GRID_SIZE = 10;
export const RECONNECT_TIMEOUT_SECONDS = 60;
