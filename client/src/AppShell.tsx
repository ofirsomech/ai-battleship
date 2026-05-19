import { GamePhase } from "shared";
import { useGame } from "./state/gameContext";
import LobbyPage from "./pages/LobbyPage";
import PlacementPage from "./pages/PlacementPage";
import GamePage from "./pages/GamePage";
import GameOverPage from "./pages/GameOverPage";

export default function AppShell() {
  const { phase, leaveRoom } = useGame();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {phase !== GamePhase.Lobby && (
        <button
          onClick={leaveRoom}
          className="fixed top-4 right-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm z-50"
        >
          Leave Room
        </button>
      )}
      {phase === GamePhase.Lobby && <LobbyPage />}
      {phase === GamePhase.Placement && <PlacementPage />}
      {phase === GamePhase.Playing && <GamePage />}
      {phase === GamePhase.Finished && <GameOverPage />}
    </div>
  );
}
