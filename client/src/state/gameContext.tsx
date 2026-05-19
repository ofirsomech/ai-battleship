import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { connectSocket, disconnectSocket, getSocket } from "./socket";
import { CellStatus, GamePhase, GRID_SIZE, ShipType } from "shared";
import type { Cell, Ship, AttackResult } from "shared";

function createEmptyGrid(): Cell[][] {
  return Array.from({ length: GRID_SIZE }, (_, row) =>
    Array.from({ length: GRID_SIZE }, (_, col) => ({
      row,
      col,
      status: CellStatus.Empty,
      shipId: null,
    }))
  );
}

interface Stats {
  totalMoves: number;
  accuracy: number;
}

interface GameContextType {
  roomCode: string | null;
  playerId: string | null;
  playerName: string;
  isConnected: boolean;
  phase: GamePhase;
  currentTurn: string | null;
  winnerId: string | null;
  yourGrid: Cell[][];
  opponentGrid: Cell[][];
  disconnectCountdown: number | null;
  errorMessage: string | null;
  stats: Stats | null;
  playerCount: number;
  isWaitingForOpponent: boolean;
  lastSunkShip: ShipType | null;
  createRoom: (name: string) => void;
  joinRoom: (code: string, name: string) => void;
  placeShips: (ships: Ship[]) => void;
  setReady: () => void;
  attackCell: (row: number, col: number) => void;
  leaveRoom: () => void;
  clearError: () => void;
  clearSunkShip: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.Lobby);
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [yourGrid, setYourGrid] = useState<Cell[][]>(createEmptyGrid());
  const [opponentGrid, setOpponentGrid] = useState<Cell[][]>(createEmptyGrid());
  const [disconnectCountdown, setDisconnectCountdown] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [isWaitingForOpponent, setIsWaitingForOpponent] = useState(false);
  const [lastSunkShip, setLastSunkShip] = useState<ShipType | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleError = useCallback((msg: string) => {
    setErrorMessage(msg);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const clearSunkShip = useCallback(() => {
    setLastSunkShip(null);
  }, []);

  const playerIdRef = React.useRef<string | null>(null);
  playerIdRef.current = playerId;

  useEffect(() => {
    const savedRoom = localStorage.getItem("battleship_room");
    const savedPlayer = localStorage.getItem("battleship_player");
    if (savedRoom && savedPlayer) {
      const socket = connectSocket({ roomCode: savedRoom, playerId: savedPlayer });
      socket.emit("game:reconnect", { roomCode: savedRoom, playerId: savedPlayer }, (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          localStorage.removeItem("battleship_room");
          localStorage.removeItem("battleship_player");
          disconnectSocket();
        }
      });
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => {
      setIsConnected(false);
      setDisconnectCountdown(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };

    const onRoomJoined = (data: { roomCode: string; playerId: string; playerCount: number }) => {
      setRoomCode(data.roomCode);
      setPlayerId(data.playerId);
      localStorage.setItem("battleship_room", data.roomCode);
      localStorage.setItem("battleship_player", data.playerId);
      setPlayerCount(data.playerCount);
      setPhase(GamePhase.Placement);
      setErrorMessage(null);
      if (data.playerCount < 2) {
        setIsWaitingForOpponent(true);
      } else {
        setIsWaitingForOpponent(false);
      }
    };

    const onPlayerJoined = (data: { playerCount: number }) => {
      setPlayerCount(data.playerCount);
      setIsWaitingForOpponent(false);
    };

    const onPlayerLeft = (data: { playerCount: number }) => {
      setPlayerCount(data.playerCount);
    };

    const onGameStarted = (data: {
      firstTurnPlayerId: string;
      yourGrid: Cell[][];
      opponentGrid: Cell[][];
    }) => {
      setYourGrid(data.yourGrid);
      setOpponentGrid(data.opponentGrid);
      setCurrentTurn(data.firstTurnPlayerId);
      setPhase(GamePhase.Playing);
      setIsWaitingForOpponent(false);
    };

    const onTurnChange = (data: { currentPlayerId: string }) => {
      setCurrentTurn(data.currentPlayerId);
    };

    const onAttackResult = (data: {
      attackerId: string;
      row: number;
      col: number;
      result: AttackResult;
    }) => {
      const isMyAttack = data.attackerId === playerIdRef.current;
      if (isMyAttack) {
        setOpponentGrid((prev) => {
          const next = prev.map((r) => r.map((c) => ({ ...c })));
          next[data.row][data.col].status = data.result.hit ? CellStatus.Hit : CellStatus.Miss;
          return next;
        });
      } else {
        setYourGrid((prev) => {
          const next = prev.map((r) => r.map((c) => ({ ...c })));
          next[data.row][data.col].status = data.result.hit ? CellStatus.Hit : CellStatus.Miss;
          return next;
        });
      }

      if (data.result.shipSunk && isMyAttack) {
        setLastSunkShip(data.result.shipSunk);
      }
    };

    const onGameOver = (data: { winnerId: string; loserId: string; stats: Stats }) => {
      setWinnerId(data.winnerId);
      setStats(data.stats);
      setPhase(GamePhase.Finished);
      localStorage.removeItem("battleship_room");
      localStorage.removeItem("battleship_player");
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };

    const onPlayerDisconnected = (data: { countdown: number }) => {
      setDisconnectCountdown(data.countdown);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        setDisconnectCountdown((prev) => {
          if (prev === null || prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const onPlayerReconnected = () => {
      setDisconnectCountdown(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };

    const onError = (data: { message: string }) => {
      setErrorMessage(data.message);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:joined", onRoomJoined);
    socket.on("room:player_joined", onPlayerJoined);
    socket.on("room:player_left", onPlayerLeft);
    socket.on("game:started", onGameStarted);
    socket.on("turn:change", onTurnChange);
    socket.on("attack:result", onAttackResult);
    socket.on("game:over", onGameOver);
    socket.on("player:disconnected", onPlayerDisconnected);
    socket.on("player:reconnected", onPlayerReconnected);
    socket.on("error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:joined", onRoomJoined);
      socket.off("room:player_joined", onPlayerJoined);
      socket.off("room:player_left", onPlayerLeft);
      socket.off("game:started", onGameStarted);
      socket.off("turn:change", onTurnChange);
      socket.off("attack:result", onAttackResult);
      socket.off("game:over", onGameOver);
      socket.off("player:disconnected", onPlayerDisconnected);
      socket.off("player:reconnected", onPlayerReconnected);
      socket.off("error", onError);
    };
  }, []);

  const createRoom = useCallback((name: string) => {
    localStorage.removeItem("battleship_room");
    localStorage.removeItem("battleship_player");
    setPlayerName(name);
    setErrorMessage(null);
    const socket = connectSocket();
    socket.emit("room:create", { playerName: name }, (response: { roomCode: string }) => {
      setRoomCode(response.roomCode);
    });
  }, []);

  const joinRoom = useCallback((code: string, name: string) => {
    localStorage.removeItem("battleship_room");
    localStorage.removeItem("battleship_player");
    setPlayerName(name);
    setErrorMessage(null);
    const socket = connectSocket();
    socket.emit(
      "room:join",
      { roomCode: code, playerName: name },
      (response: { success: boolean; error?: string; roomCode?: string; playerId?: string }) => {
        if (!response.success) {
          handleError(response.error ?? "Failed to join room");
          return;
        }
        setRoomCode(response.roomCode ?? code);
        setPlayerId(response.playerId ?? null);
      }
    );
  }, [handleError]);

  const placeShips = useCallback(
    (ships: Ship[]) => {
      if (!roomCode) return;
      getSocket().emit(
        "ship:place_all",
        { roomCode, ships },
        (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            handleError(response.error ?? "Failed to place ships");
          }
        }
      );
    },
    [roomCode, handleError]
  );

  const setReady = useCallback(() => {
    if (!roomCode) return;
    getSocket().emit("player:ready", { roomCode });
    setIsWaitingForOpponent(true);
  }, [roomCode]);

  const attackCell = useCallback(
    (row: number, col: number) => {
      if (!roomCode) return;
      getSocket().emit(
        "attack:cell",
        { roomCode, row, col },
        (response: { result: AttackResult }) => {
          if (response.result.shipSunk) {
            setLastSunkShip(response.result.shipSunk);
          }
          if (!response.result.hit) {
            setCurrentTurn(null);
          }
        }
      );
    },
    [roomCode]
  );

  const leaveRoom = useCallback(() => {
    localStorage.removeItem("battleship_room");
    localStorage.removeItem("battleship_player");
    if (roomCode) {
      getSocket().emit("player:leave", { roomCode });
    }
    disconnectSocket();
    setRoomCode(null);
    setPlayerId(null);
    setPlayerName("");
    setPhase(GamePhase.Lobby);
    setCurrentTurn(null);
    setWinnerId(null);
    setYourGrid(createEmptyGrid());
    setOpponentGrid(createEmptyGrid());
    setDisconnectCountdown(null);
    setErrorMessage(null);
    setStats(null);
    setPlayerCount(0);
    setIsWaitingForOpponent(false);
    setLastSunkShip(null);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, [roomCode]);

  const value: GameContextType = {
    roomCode,
    playerId,
    playerName,
    isConnected,
    phase,
    currentTurn,
    winnerId,
    yourGrid,
    opponentGrid,
    disconnectCountdown,
    errorMessage,
    stats,
    playerCount,
    isWaitingForOpponent,
    lastSunkShip,
    createRoom,
    joinRoom,
    placeShips,
    setReady,
    attackCell,
    leaveRoom,
    clearError,
    clearSunkShip,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used within GameProvider");
  }
  return ctx;
}
