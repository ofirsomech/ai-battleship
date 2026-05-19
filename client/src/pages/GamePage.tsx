import { useEffect } from "react";
import { CellStatus } from "shared";
import { useGame } from "../state/gameContext";

function getCellColor(status: CellStatus, isOwn: boolean): string {
  switch (status) {
    case CellStatus.Empty:
      return "bg-blue-900 border-blue-700";
    case CellStatus.Occupied:
      return isOwn ? "bg-gray-400 border-gray-500" : "bg-blue-900 border-blue-700";
    case CellStatus.Hit:
      return "bg-red-600 border-red-500";
    case CellStatus.Miss:
      return "bg-gray-600 border-gray-500";
  }
}

function YourGrid({ grid }: { grid: CellStatus[][] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-center">Your Fleet</h3>
      <div className="grid grid-cols-10 gap-0.5 w-fit mx-auto">
        {grid.flatMap((row, ri) =>
          row.map((status, ci) => (
            <div
              key={`y-${ri}-${ci}`}
              className={`w-8 h-8 border ${getCellColor(status, true)}`}
            />
          ))
        )}
      </div>
    </div>
  );
}

function EnemyGrid({
  grid,
  isMyTurn,
  onAttack,
}: {
  grid: CellStatus[][];
  isMyTurn: boolean;
  onAttack: (row: number, col: number) => void;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-center">Enemy Waters</h3>
      <div className="grid grid-cols-10 gap-0.5 w-fit mx-auto">
        {grid.flatMap((row, ri) =>
          row.map((status, ci) => {
            const alreadyAttacked = status === CellStatus.Hit || status === CellStatus.Miss;
            const canClick = isMyTurn && !alreadyAttacked;
            return (
              <button
                key={`e-${ri}-${ci}`}
                className={`w-8 h-8 border ${getCellColor(status, false)} ${
                  canClick ? "cursor-crosshair hover:brightness-125" : "cursor-not-allowed"
                }`}
                onClick={() => canClick && onAttack(ri, ci)}
                disabled={!canClick}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default function GamePage() {
  const {
    playerId,
    currentTurn,
    yourGrid,
    opponentGrid,
    disconnectCountdown,
    attackCell,
    lastSunkShip,
    clearSunkShip,
  } = useGame();

  const isMyTurn = currentTurn === playerId;

  useEffect(() => {
    if (lastSunkShip) {
      const timer = setTimeout(() => clearSunkShip(), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastSunkShip, clearSunkShip]);

  const yourStatuses: CellStatus[][] = yourGrid.map((row) => row.map((c) => c.status));
  const opponentStatuses: CellStatus[][] = opponentGrid.map((row) => row.map((c) => c.status));

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="flex items-center gap-4">
        <div
          className={`px-6 py-2 rounded-full text-lg font-bold ${
            isMyTurn ? "bg-green-600 text-white" : "bg-gray-700 text-gray-400"
          }`}
        >
          {isMyTurn ? "Your Turn" : "Opponent's Turn"}
        </div>
      </div>

      {disconnectCountdown !== null && (
        <div className="bg-yellow-600/30 border border-yellow-600 rounded px-6 py-3 text-center">
          <p className="text-yellow-300 text-lg font-semibold">Opponent disconnected</p>
          <p className="text-yellow-200">Reconnecting in {disconnectCountdown}s...</p>
        </div>
      )}

      {lastSunkShip && (
        <div className="bg-orange-600/30 border border-orange-500 rounded px-6 py-3 text-center animate-pulse">
          <p className="text-orange-200 text-lg font-bold">You sunk their {lastSunkShip}!</p>
        </div>
      )}

      <div className="flex flex-wrap gap-8 justify-center">
        <YourGrid grid={yourStatuses} />
        <EnemyGrid grid={opponentStatuses} isMyTurn={isMyTurn} onAttack={attackCell} />
      </div>
    </div>
  );
}
