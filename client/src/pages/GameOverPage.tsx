import { useGame } from "../state/gameContext";
import { Button } from "../components/index.js";

export default function GameOverPage() {
  const { winnerId, playerId, stats, playerName, leaveRoom } = useGame();

  const isWinner = winnerId === playerId;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1
        className={`text-5xl font-bold ${
          isWinner ? "text-yellow-400" : "text-red-500"
        }`}
      >
        {isWinner ? "You Win!" : "You Lose"}
      </h1>

      <p className="text-xl text-gray-300">
        {isWinner ? "Congratulations, " : "Better luck next time, "}
        {playerName}!
      </p>

      {stats && (
        <div className="bg-gray-800 rounded-lg p-6 flex flex-col gap-3 text-center">
          <h2 className="text-lg text-gray-400 uppercase tracking-wide">Stats</h2>
          <div className="flex gap-8">
            <div>
              <p className="text-sm text-gray-500">Total Moves</p>
              <p className="text-2xl font-bold">{stats.totalMoves}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Accuracy</p>
              <p className="text-2xl font-bold">{(stats.accuracy * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={leaveRoom}
        variant="primary"
        size="lg"
      >
        Play Again
      </Button>
    </div>
  );
}
