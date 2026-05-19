import { Server, Socket } from "socket.io";
import {
  CellStatus,
  GamePhase,
  GameState,
  Cell,
  RECONNECT_TIMEOUT_SECONDS,
} from "shared";
import {
  generateRoomCode,
  createRoom,
  joinRoom,
  playerLeave,
  getPlayerCount,
  isRoomFull,
  GameError,
} from "../domain/index.js";
import {
  validateRoomCode,
  validatePlayerName,
  validatePlayerId,
} from "../validation.js";
import {
  getRoom,
  setRoom,
  getPlayerRoom,
  setPlayerRoom,
  removePlayerRoom,
  setDisconnectTimer,
  clearDisconnectTimer,
  isRoomLimitReached,
} from "../state.js";

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

function setPlayerConnected(
  game: GameState,
  playerId: string,
  isConnected: boolean
): GameState {
  return {
    ...game,
    players: game.players.map((p) =>
      p.id === playerId ? { ...p, isConnected } : p
    ),
  };
}

function handleError(socket: Socket, err: unknown): void {
  if (err instanceof GameError) {
    socket.emit("error", { message: err.message });
    return;
  }
  console.error("Unexpected error:", err);
  socket.emit("error", { message: "Something went wrong" });
}

export function registerRoomHandlers(io: Server, socket: Socket): void {
  socket.on("room:create", (payload, ack) => {
    try {
      const playerName = validatePlayerName(payload.playerName);

      if (isRoomLimitReached()) {
        throw new GameError("Server at capacity, try again later");
      }

      const roomCode = generateRoomCode();
      const playerId = socket.data.playerId as string;

      const game = createRoom(roomCode, playerId, playerName);
      setRoom(roomCode, game);
      setPlayerRoom(playerId, roomCode);

      socket.join(roomCode);

      socket.emit("room:joined", {
        roomCode,
        playerId,
        playerCount: getPlayerCount(game),
      });

      if (typeof ack === "function") {
        ack({ roomCode });
      }
    } catch (err) {
      handleError(socket, err);
    }
  });

  socket.on("room:join", (payload, ack) => {
    try {
      const roomCode = validateRoomCode(payload.roomCode);
      const playerName = validatePlayerName(payload.playerName);
      const playerId = socket.data.playerId as string;

      const game = getRoom(roomCode);

      if (isRoomFull(game)) {
        throw new GameError("Room is full");
      }

      if (game.phase === GamePhase.Finished) {
        throw new GameError("Cannot join a finished game");
      }

      const newGame = joinRoom(game, playerId, playerName);
      setRoom(roomCode, newGame);
      setPlayerRoom(playerId, roomCode);

      socket.join(roomCode);

      socket.to(roomCode).emit("room:player_joined", {
        playerCount: getPlayerCount(newGame),
      });

      socket.emit("room:joined", {
        roomCode,
        playerId,
        playerCount: getPlayerCount(newGame),
      });

      if (typeof ack === "function") {
        ack({ success: true, roomCode, playerId });
      }
    } catch (err) {
      handleError(socket, err);
      if (typeof ack === "function") {
        ack({
          success: false,
          error:
            err instanceof GameError ? err.message : "Something went wrong",
        });
      }
    }
  });

  socket.on("game:reconnect", (payload, ack) => {
    try {
      const roomCode = validateRoomCode(payload.roomCode);
      const playerId = validatePlayerId(payload.playerId);

      const game = getRoom(roomCode);
      const player = game.players.find((p) => p.id === playerId);

      if (!player) {
        throw new GameError("Player not found in room");
      }

      clearDisconnectTimer(playerId);

      const newGame = setPlayerConnected(game, playerId, true);
      setRoom(roomCode, newGame);

      socket.join(roomCode);
      setPlayerRoom(playerId, roomCode);

      socket.to(roomCode).emit("player:reconnected", {});

      const opponent = newGame.players.find((p) => p.id !== playerId);

      if (typeof ack === "function") {
        ack({
          success: true,
          game: {
            roomCode: newGame.roomCode,
            phase: newGame.phase,
            currentTurn: newGame.currentTurn,
            yourGrid: player.grid,
            opponentGrid: opponent
              ? maskOpponentGrid(opponent.grid)
              : [],
          },
        });
      }
    } catch (err) {
      handleError(socket, err);
      if (typeof ack === "function") {
        ack({
          success: false,
          error:
            err instanceof GameError ? err.message : "Something went wrong",
        });
      }
    }
  });

  socket.on("player:leave", (payload, ack) => {
    try {
      const roomCode = validateRoomCode(payload.roomCode);
      const playerId = socket.data.playerId as string;

      const game = getRoom(roomCode);

      clearDisconnectTimer(playerId);

      const newGame = playerLeave(game, playerId);
      removePlayerRoom(playerId);

      socket.leave(roomCode);

      if (newGame.phase === GamePhase.Finished) {
        const winner = newGame.winnerId
          ? newGame.players.find((p) => p.id === newGame.winnerId) ??
            newGame.players[0]
          : newGame.players[0];

        setRoom(roomCode, newGame);

        const loserGrid = game.players.find((p) => p.id !== winner.id)?.grid;
        const totalMoves = loserGrid
          ? loserGrid.flat().filter(
              (c) =>
                c.status === CellStatus.Hit || c.status === CellStatus.Miss
            ).length
          : 0;
        const hits = loserGrid
          ? loserGrid.flat().filter((c) => c.status === CellStatus.Hit)
              .length
          : 0;
        const accuracy = totalMoves > 0 ? Math.round((hits / totalMoves) * 100) : 0;

        io.to(roomCode).emit("game:over", {
          winnerId: winner.id,
          loserId: playerId,
          stats: { totalMoves, accuracy },
        });
      } else {
        setRoom(roomCode, newGame);
        socket.to(roomCode).emit("room:player_left", {
          playerCount: getPlayerCount(newGame),
        });
      }

      if (typeof ack === "function") {
        ack({ success: true });
      }
    } catch (err) {
      handleError(socket, err);
    }
  });

  socket.on("disconnect", () => {
    const playerId = socket.data.playerId as string | undefined;
    if (!playerId) return;

    const roomCode = getPlayerRoom(playerId);
    if (!roomCode) return;

    try {
      const game = getRoom(roomCode);
      const newGame = setPlayerConnected(game, playerId, false);
      setRoom(roomCode, newGame);

      if (game.phase === GamePhase.Playing) {
        socket.to(roomCode).emit("player:disconnected", {
          countdown: RECONNECT_TIMEOUT_SECONDS,
        });

        const timer = setTimeout(() => {
          try {
            const currentGame = getRoom(roomCode);
            const currentPlayer = currentGame.players.find(
              (p) => p.id === playerId
            );

            if (
              currentPlayer &&
              !currentPlayer.isConnected &&
              currentGame.phase === GamePhase.Playing
            ) {
              const finished = playerLeave(currentGame, playerId);
              setRoom(roomCode, finished);

              const winner = finished.winnerId
                ? finished.players.find((p) => p.id === finished.winnerId)
                : finished.players[0];
              const loserGrid = currentGame.players.find(
                (p) => p.id !== winner?.id
              )?.grid;
              const totalMoves = loserGrid
                ? loserGrid.flat().filter(
                    (c) =>
                      c.status === CellStatus.Hit ||
                      c.status === CellStatus.Miss
                  ).length
                : 0;
              const hits = loserGrid
                ? loserGrid.flat().filter(
                    (c) => c.status === CellStatus.Hit
                  ).length
                : 0;
              const accuracy =
                totalMoves > 0 ? Math.round((hits / totalMoves) * 100) : 0;

              removePlayerRoom(playerId);
              clearDisconnectTimer(playerId);

              io.to(roomCode).emit("game:over", {
                winnerId: winner?.id ?? "",
                loserId: playerId,
                stats: { totalMoves, accuracy },
              });
            }
          } catch {
            clearDisconnectTimer(playerId);
          }
        }, RECONNECT_TIMEOUT_SECONDS * 1000);

        setDisconnectTimer(playerId, timer);
      }
    } catch {
      removePlayerRoom(playerId);
    }
  });
}
