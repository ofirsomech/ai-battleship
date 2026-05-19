import { describe, it, expect } from "vitest";
import { processAttack, getOpponentId } from "../attack.js";
import { GameError } from "../errors.js";
import { createRoom, joinRoom, playerReady } from "../room.js";
import { createShips, placeShip } from "../ship.js";
import { CellStatus, GameState, GamePhase, ShipType, Cell } from "shared";

function buildPlayingState(): GameState {
  let game = createRoom("ABCD", "p1", "Player 1");
  game = joinRoom(game, "p2", "Player 2");
  game = playerReady(game, "p1");
  game = playerReady(game, "p2");

  const occupiedGrid = game.players[0].grid.map((row) =>
    row.map((cell) => ({ ...cell }))
  );
  game = { ...game, players: game.players.map((p) => ({ ...p, grid: occupiedGrid.map((row) => row.map((cell) => ({ ...cell }))) })) };

  const ships = createShips();
  const destroyer = ships.find((s) => s.type === ShipType.Destroyer)!;
  const battleship = ships.find((s) => s.type === ShipType.Battleship)!;
  const carrier = ships.find((s) => s.type === ShipType.Carrier)!;
  const cruiser = ships.find((s) => s.type === ShipType.Cruiser)!;
  const submarine = ships.find((s) => s.type === ShipType.Submarine)!;

  const p2 = { ...game.players[1] };
  const grid = p2.grid.map((row) => row.map((cell) => ({ ...cell })));

  const dPlaced = placeShip(destroyer, { row: 0, col: 0 }, false);
  p2.ships = [dPlaced, placeShip(battleship, { row: 1, col: 0 }, false), placeShip(carrier, { row: 2, col: 0 }, false), placeShip(cruiser, { row: 3, col: 0 }, false), placeShip(submarine, { row: 4, col: 0 }, false)];

  for (const ship of p2.ships) {
    for (const pos of ship.position) {
      grid[pos.row][pos.col] = {
        row: pos.row,
        col: pos.col,
        status: CellStatus.Occupied,
        shipId: ship.id,
      };
    }
  }

  return {
    ...game,
    players: [game.players[0], { ...p2, grid }],
  };
}

function allShipsHitGrid(): Cell[][] {
  const grid: Cell[][] = [];
  for (let row = 0; row < 10; row++) {
    grid[row] = [];
    for (let col = 0; col < 10; col++) {
      grid[row][col] = {
        row,
        col,
        status: CellStatus.Hit,
        shipId: null,
      };
    }
  }
  return grid;
}

describe("processAttack", () => {
  it("registers a hit when attacking an occupied cell", () => {
    const game = buildPlayingState();
    const { result, gameState } = processAttack(game, "p1", 0, 0);

    expect(result.hit).toBe(true);
    expect(result.shipSunk).toBeNull();
    expect(result.row).toBe(0);
    expect(result.col).toBe(0);
    expect(gameState.players[1].grid[0][0].status).toBe(CellStatus.Hit);
    expect(gameState.currentTurn).toBe("p2");
  });

  it("registers a miss when attacking an empty cell", () => {
    const game = buildPlayingState();
    const { result, gameState } = processAttack(game, "p1", 9, 9);

    expect(result.hit).toBe(false);
    expect(result.shipSunk).toBeNull();
    expect(gameState.players[1].grid[9][9].status).toBe(CellStatus.Miss);
    expect(gameState.currentTurn).toBe("p2");
  });

  it("sinks a ship when all its cells are hit", () => {
    const game = buildPlayingState();
    const destroyer = game.players[1].ships.find((s) => s.type === ShipType.Destroyer)!;

    let state = game;
    let { result, gameState } = processAttack(state, "p1", 0, 0);
    expect(result.hit).toBe(true);
    expect(result.shipSunk).toBeNull();

    state = { ...gameState, currentTurn: "p1" };
    ({ result, gameState } = processAttack(state, "p1", 0, 1));
    expect(result.hit).toBe(true);
    expect(result.shipSunk).toBe(ShipType.Destroyer);
    expect(gameState.players[1].ships.find((s) => s.type === ShipType.Destroyer)!.sunk).toBe(true);
  });

  it("throws when not the attacker's turn", () => {
    const game = buildPlayingState();
    expect(() => processAttack(game, "p2", 0, 0)).toThrow(GameError);
    expect(() => processAttack(game, "p2", 0, 0)).toThrow("Not your turn");
  });

  it("throws when attacking the same cell twice", () => {
    const game = buildPlayingState();
    const { gameState } = processAttack(game, "p1", 5, 5);

    const state = { ...gameState, currentTurn: "p1" };
    expect(() => processAttack(state, "p1", 5, 5)).toThrow("Cell already attacked");
  });

  it("throws when coordinates are out of bounds", () => {
    const game = buildPlayingState();
    expect(() => processAttack(game, "p1", -1, 0)).toThrow("out of bounds");
    expect(() => processAttack(game, "p1", 0, 10)).toThrow("out of bounds");
  });

  it("detects win condition when all opponent ships are sunk", () => {
    const game = buildPlayingState();
    const oppShips = game.players[1].ships;
    const allOppPositions = oppShips.flatMap((s) => s.position);

    let state = game;
    for (const pos of allOppPositions) {
      state = { ...state, currentTurn: "p1" };
      const { gameState } = processAttack(state, "p1", pos.row, pos.col);
      state = gameState;
    }

    expect(state.phase).toBe(GamePhase.Finished);
    expect(state.winnerId).toBe("p1");
  });

  it("does not mutate the original game state", () => {
    const game = buildPlayingState();
    const originalGrid = game.players[1].grid[0][0].status;
    processAttack(game, "p1", 0, 0);
    expect(game.players[1].grid[0][0].status).toBe(originalGrid);
  });
});

describe("getOpponentId", () => {
  it("returns the correct opponent ID", () => {
    const game = createRoom("TEST", "p1", "One");
    const joined = joinRoom(game, "p2", "Two");
    expect(getOpponentId(joined, "p1")).toBe("p2");
    expect(getOpponentId(joined, "p2")).toBe("p1");
  });

  it("throws when opponent not found", () => {
    const game = createRoom("TEST", "p1", "One");
    expect(() => getOpponentId(game, "p1")).toThrow(GameError);
  });
});
