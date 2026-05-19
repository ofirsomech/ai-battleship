import { describe, it, expect } from "vitest";
import {
  generateRoomCode,
  createRoom,
  joinRoom,
  playerReady,
  playerLeave,
  getPlayerCount,
  isRoomFull,
  createEmptyGrid,
} from "../room.js";
import { GameError } from "../errors.js";
import { GamePhase, CellStatus, GRID_SIZE } from "shared";

describe("generateRoomCode", () => {
  it("returns a 4-character uppercase string", () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(4);
    expect(/^[A-Z]{4}$/.test(code)).toBe(true);
  });

  it("generates different codes on subsequent calls (probabilistic)", () => {
    const codes = new Set(Array.from({ length: 10 }, () => generateRoomCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("createRoom", () => {
  it("creates a valid GameState with lobby phase", () => {
    const game = createRoom("ABCD", "p1", "Player One");
    expect(game.roomCode).toBe("ABCD");
    expect(game.phase).toBe(GamePhase.Lobby);
    expect(game.players).toHaveLength(1);
    expect(game.players[0].id).toBe("p1");
    expect(game.players[0].name).toBe("Player One");
    expect(game.players[0].isReady).toBe(false);
    expect(game.players[0].isConnected).toBe(true);
    expect(game.currentTurn).toBeNull();
    expect(game.winnerId).toBeNull();
    expect(game.disconnectTimer).toBeNull();
  });

  it("creates a valid 10x10 empty grid for the player", () => {
    const game = createRoom("EFGH", "p1", "P1");
    const grid = game.players[0].grid;
    expect(grid).toHaveLength(GRID_SIZE);
    grid.forEach((row) => {
      expect(row).toHaveLength(GRID_SIZE);
      row.forEach((cell) => {
        expect(cell.status).toBe(CellStatus.Empty);
        expect(cell.shipId).toBeNull();
      });
    });
  });

  it("provides each player with 5 ships", () => {
    const game = createRoom("WXYZ", "p1", "P1");
    expect(game.players[0].ships).toHaveLength(5);
  });
});

describe("joinRoom", () => {
  it("adds a second player to the room", () => {
    let game = createRoom("ABCD", "p1", "Player 1");
    game = joinRoom(game, "p2", "Player 2");
    expect(game.players).toHaveLength(2);
    expect(game.players[1].id).toBe("p2");
    expect(game.players[1].name).toBe("Player 2");
  });

  it("throws when room is full", () => {
    let game = createRoom("ABCD", "p1", "Player 1");
    game = joinRoom(game, "p2", "Player 2");
    expect(() => joinRoom(game, "p3", "Player 3")).toThrow(GameError);
    expect(() => joinRoom(game, "p3", "Player 3")).toThrow("Room is full");
  });

  it("throws when joining a finished game", () => {
    let game = createRoom("ABCD", "p1", "Player 1");
    game = joinRoom(game, "p2", "Player 2");
    game = { ...game, phase: GamePhase.Finished };
    expect(() => joinRoom(game, "p3", "Player 3")).toThrow("Cannot join a finished game");
  });
});

describe("playerReady", () => {
  it("marks a player as ready", () => {
    let game = createRoom("ABCD", "p1", "Player 1");
    game = joinRoom(game, "p2", "Player 2");
    const updated = playerReady(game, "p1");
    expect(updated.players.find((p) => p.id === "p1")!.isReady).toBe(true);
    expect(updated.players.find((p) => p.id === "p2")!.isReady).toBe(false);
  });

  it("starts game when both players are ready", () => {
    let game = createRoom("ABCD", "p1", "Player 1");
    game = joinRoom(game, "p2", "Player 2");
    game = playerReady(game, "p1");
    game = playerReady(game, "p2");
    expect(game.phase).toBe(GamePhase.Playing);
    expect(game.currentTurn).toBe("p1");
  });

  it("does not start game when only one player is ready", () => {
    let game = createRoom("ABCD", "p1", "Player 1");
    game = joinRoom(game, "p2", "Player 2");
    game = playerReady(game, "p1");
    expect(game.phase).toBe(GamePhase.Lobby);
    expect(game.currentTurn).toBeNull();
  });
});

describe("playerLeave", () => {
  it("removes player from lobby", () => {
    let game = createRoom("ABCD", "p1", "Player 1");
    game = joinRoom(game, "p2", "Player 2");
    const updated = playerLeave(game, "p1");
    expect(updated.players).toHaveLength(1);
    expect(updated.players[0].id).toBe("p2");
  });

  it("grants victory to remaining player when leaving during playing phase", () => {
    let game = createRoom("ABCD", "p1", "Player 1");
    game = joinRoom(game, "p2", "Player 2");
    game = playerReady(game, "p1");
    game = playerReady(game, "p2");
    const updated = playerLeave(game, "p1");
    expect(updated.phase).toBe(GamePhase.Finished);
    expect(updated.winnerId).toBe("p2");
  });

  it("removes the second player correctly", () => {
    let game = createRoom("ABCD", "p1", "Player 1");
    game = joinRoom(game, "p2", "Player 2");
    const updated = playerLeave(game, "p2");
    expect(updated.players).toHaveLength(1);
    expect(updated.players[0].id).toBe("p1");
  });
});

describe("getPlayerCount", () => {
  it("returns the number of players in the room", () => {
    const game = createRoom("ABCD", "p1", "Player 1");
    expect(getPlayerCount(game)).toBe(1);
  });
});

describe("isRoomFull", () => {
  it("returns false for a room with one player", () => {
    const game = createRoom("ABCD", "p1", "Player 1");
    expect(isRoomFull(game)).toBe(false);
  });

  it("returns true for a room with two players", () => {
    let game = createRoom("ABCD", "p1", "Player 1");
    game = joinRoom(game, "p2", "Player 2");
    expect(isRoomFull(game)).toBe(true);
  });
});

describe("createEmptyGrid", () => {
  it("returns a 10x10 grid of empty cells", () => {
    const grid = createEmptyGrid();
    expect(grid).toHaveLength(10);
    for (let r = 0; r < 10; r++) {
      expect(grid[r]).toHaveLength(10);
      for (let c = 0; c < 10; c++) {
        expect(grid[r][c].row).toBe(r);
        expect(grid[r][c].col).toBe(c);
        expect(grid[r][c].status).toBe(CellStatus.Empty);
        expect(grid[r][c].shipId).toBeNull();
      }
    }
  });
});
