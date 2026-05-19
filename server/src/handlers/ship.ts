import { Server, Socket } from "socket.io";
import {
  CellStatus,
  GamePhase,
  GameState,
  Cell,
  SHIP_SIZES,
  ShipType,
  Ship,
} from "shared";
import {
  allShipsPlaced,
  playerReady,
  GameError,
} from "../domain/index.js";
import { validateRoomCode, validateShipPlacement } from "../validation.js";
import { getRoom, setRoom } from "../state.js";

function maskOpponentGrid(grid: Cell[][]): Cell[][] {
  return grid.map((row) =>
    row.map((cell) => ({
      ...cell,
      status:
        cell.status === CellStatus.Occupied ? CellStatus.Empty : cell.status,
      shipId: null,
    }))
  );
}

function handleError(socket: Socket, err: unknown): void {
  if (err instanceof GameError) {
    socket.emit("error", { message: err.message });
    return;
  }
  console.error("Unexpected error:", err);
  socket.emit("error", { message: "Something went wrong" });
}

export function registerShipHandlers(io: Server, socket: Socket): void {
  socket.on("ship:place_all", (payload, ack) => {
    try {
      const { roomCode, ships } = validateShipPlacement(payload);
      const playerId = socket.data.playerId as string;
      const game = getRoom(roomCode);

      const player = game.players.find((p) => p.id === playerId);
      if (!player) {
        throw new GameError("Player not in room");
      }

      const newGrid: Cell[][] = [];
      for (let r = 0; r < 10; r++) {
        newGrid[r] = [];
        for (let c = 0; c < 10; c++) {
          newGrid[r][c] = {
            row: r,
            col: c,
            status: CellStatus.Empty,
            shipId: null,
          };
        }
      }

      const occupiedCells: { row: number; col: number }[] = [];

      for (const ship of ships) {
        const expectedSize =
          SHIP_SIZES[ship.type as ShipType];
        if (expectedSize === undefined) {
          throw new GameError("Invalid ship type");
        }
        if (ship.position.length !== expectedSize) {
          throw new GameError("Invalid ship placement");
        }

        for (const pos of ship.position) {
          if (
            pos.row < 0 ||
            pos.row >= 10 ||
            pos.col < 0 ||
            pos.col >= 10
          ) {
            throw new GameError("Ship placement out of bounds");
          }
          if (
            occupiedCells.some(
              (o) => o.row === pos.row && o.col === pos.col
            )
          ) {
            throw new GameError("Ships cannot overlap");
          }
          occupiedCells.push({ row: pos.row, col: pos.col });
          newGrid[pos.row][pos.col] = {
            row: pos.row,
            col: pos.col,
            status: CellStatus.Occupied,
            shipId: ship.id,
          };
        }
      }

      const newPlayers = game.players.map((p) =>
        p.id === playerId
          ? { ...p, grid: newGrid, ships }
          : p
      );

      const newGame: GameState = {
        ...game,
        players: newPlayers,
        phase:
          game.phase === GamePhase.Lobby
            ? GamePhase.Placement
            : game.phase,
      };

      setRoom(roomCode, newGame);

      if (typeof ack === "function") {
        ack({ success: true });
      }
    } catch (err) {
      handleError(socket, err);
      if (typeof ack === "function") {
        ack({ success: false, error: (err as Error).message });
      }
    }
  });

  socket.on("player:ready", (payload) => {
    try {
      const roomCode = validateRoomCode(payload.roomCode);
      const playerId = socket.data.playerId as string;
      const game = getRoom(roomCode);

      const player = game.players.find((p) => p.id === playerId);
      if (!player) {
        throw new GameError("Player not in room");
      }

      if (!allShipsPlaced(player.ships)) {
        throw new GameError("Not all ships placed");
      }

      const newGame = playerReady(game, playerId);
      setRoom(roomCode, newGame);

      if (
        newGame.phase === GamePhase.Playing &&
        newGame.currentTurn
      ) {
        const sockets = io.sockets.adapter.rooms.get(roomCode);
        if (sockets) {
          for (const socketId of sockets) {
            const s = io.sockets.sockets.get(socketId);
            if (!s) continue;
            const pid = s.data.playerId as string;
            const plyr = newGame.players.find((p) => p.id === pid);
            if (!plyr) continue;
            const opponent = newGame.players.find(
              (p) => p.id !== plyr.id
            );
            io.to(socketId).emit("game:started", {
              firstTurnPlayerId: newGame.currentTurn,
              yourGrid: plyr.grid,
              opponentGrid: opponent
                ? maskOpponentGrid(opponent.grid)
                : [],
            });
          }
        }

        io.to(roomCode).emit("turn:change", {
          currentPlayerId: newGame.currentTurn,
        });
      }
    } catch (err) {
      handleError(socket, err);
    }
  });
}
