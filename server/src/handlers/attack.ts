import { Server, Socket } from "socket.io";
import { CellStatus, GamePhase } from "shared";
import { processAttack, GameError } from "../domain/index.js";
import { validateRoomCode, validateCoordinate } from "../validation.js";
import { getRoom, setRoom } from "../state.js";

const attackCooldowns = new Map<string, number>();

function checkAttackCooldown(playerId: string): boolean {
  const key = `attack:${playerId}`;
  const now = Date.now();
  const last = attackCooldowns.get(key) ?? 0;
  if (now - last < 2000) return false;
  attackCooldowns.set(key, now);
  return true;
}

function handleError(socket: Socket, err: unknown): void {
  if (err instanceof GameError) {
    socket.emit("error", { message: err.message });
    return;
  }
  console.error("Unexpected error:", err);
  socket.emit("error", { message: "Something went wrong" });
}

export function registerAttackHandlers(io: Server, socket: Socket): void {
  socket.on("attack:cell", (payload, ack) => {
    try {
      const roomCode = validateRoomCode(payload.roomCode);
      const row = validateCoordinate(payload.row);
      const col = validateCoordinate(payload.col);
      const playerId = socket.data.playerId as string;

      const game = getRoom(roomCode);

      if (game.phase !== GamePhase.Playing) {
        throw new GameError("Game is not in progress");
      }

      if (game.currentTurn !== playerId) {
        throw new GameError("Not your turn");
      }

      if (!checkAttackCooldown(playerId)) {
        socket.emit("error", { message: "Wait before attacking again" });
        return;
      }

      const { gameState: newGame, result } = processAttack(
        game,
        playerId,
        row,
        col
      );

      setRoom(roomCode, newGame);

      io.to(roomCode).emit("attack:result", {
        attackerId: playerId,
        row,
        col,
        result,
      });

      if (newGame.phase === GamePhase.Finished && newGame.winnerId) {
        const loser = newGame.players.find(
          (p) => p.id !== newGame.winnerId
        );
        const loserGrid = loser?.grid;
        const totalMoves = loserGrid
          ? loserGrid.flat().filter(
              (c) =>
                c.status === CellStatus.Hit ||
                c.status === CellStatus.Miss
            ).length
          : 0;
        const hits = loserGrid
          ? loserGrid.flat().filter((c) => c.status === CellStatus.Hit)
              .length
          : 0;
        const accuracy =
          totalMoves > 0 ? Math.round((hits / totalMoves) * 100) : 0;

        io.to(roomCode).emit("game:over", {
          winnerId: newGame.winnerId,
          loserId: loser?.id ?? "",
          stats: { totalMoves, accuracy },
        });
      } else {
        io.to(roomCode).emit("turn:change", {
          currentPlayerId: newGame.currentTurn,
        });
      }

      if (typeof ack === "function") {
        ack({ result });
      }
    } catch (err) {
      handleError(socket, err);
    }
  });
}
