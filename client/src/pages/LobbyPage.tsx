import { useState } from "react";
import { useGame } from "../state/gameContext";
import { Button } from "../components/index.js";

export default function LobbyPage() {
  const { createRoom, joinRoom, roomCode, errorMessage, clearError, isWaitingForOpponent, playerCount } = useGame();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createRoom(trimmed);
  };

  const handleJoin = () => {
    const trimmedName = name.trim();
    const trimmedCode = joinCode.trim().toUpperCase();
    if (!trimmedName || !trimmedCode) return;
    joinRoom(trimmedCode, trimmedName);
  };

  const handleCopyCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
    } catch {
      // Clipboard not available
    }
  };

  if (roomCode && isWaitingForOpponent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-3xl font-bold">Waiting for Opponent</h1>
        <p className="text-lg text-gray-400">
          Players in room: {playerCount}/2
        </p>
        <p className="text-lg">Room Code:</p>
        <div className="flex items-center gap-2">
          <code className="text-4xl font-mono text-white bg-gray-800 px-6 py-3 rounded tracking-widest">
            {roomCode}
          </code>
          <button
            onClick={handleCopyCode}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            Copy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-4xl font-bold">Battleship</h1>

      {errorMessage && (
        <div className="bg-red-600/20 border border-red-600 rounded px-4 py-2 flex items-center gap-2">
          <span>{errorMessage}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-300 font-bold">
            ×
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={20}
        className="px-4 py-2 text-white placeholder-gray-500 bg-gray-800 border border-gray-600 rounded w-64 text-center"
      />

      <Button
        onClick={handleCreate}
        disabled={!name.trim()}
        variant="primary"
        size="lg"
        className="w-64"
      >
        Create Room
      </Button>

      <div className="flex items-center gap-2 text-gray-400">
        <div className="h-px w-20 bg-gray-600" />
        <span>or</span>
        <div className="h-px w-20 bg-gray-600" />
      </div>

      <input
        type="text"
        placeholder="Room code"
        value={joinCode}
        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
        maxLength={6}
        className="px-4 py-2 text-white placeholder-gray-500 bg-gray-800 border border-gray-600 rounded w-64 text-center font-mono tracking-widest"
      />

      <Button
        onClick={handleJoin}
        disabled={!name.trim() || !joinCode.trim()}
        variant="secondary"
        size="lg"
        className="w-64"
      >
        Join Room
      </Button>
    </div>
  );
}
