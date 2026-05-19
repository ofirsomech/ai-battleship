import { useState, useCallback } from "react";
import { CellStatus, GamePhase, ShipType, SHIP_SIZES, GRID_SIZE } from "shared";
import type { Cell, Ship, Position } from "shared";
import { useGame } from "../state/gameContext";

type ShipPlacementEntry = {
  type: ShipType;
  positions: Position[];
  orientation: "horizontal" | "vertical";
};

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

function isValidPlacement(
  grid: Cell[][],
  size: number,
  startRow: number,
  startCol: number,
  horizontal: boolean
): boolean {
  const positions: Position[] = [];
  for (let i = 0; i < size; i++) {
    const row = horizontal ? startRow : startRow + i;
    const col = horizontal ? startCol + i : startCol;
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return false;
    if (grid[row][col].status === CellStatus.Occupied) return false;
    positions.push({ row, col });
  }
  return true;
}

function getCellColor(status: CellStatus): string {
  switch (status) {
    case CellStatus.Empty:
      return "bg-blue-900 border-blue-700";
    case CellStatus.Occupied:
      return "bg-gray-400 border-gray-500";
    default:
      return "bg-blue-900 border-blue-700";
  }
}

export default function PlacementPage() {
  const { roomCode, playerName, placeShips, setReady, isWaitingForOpponent, errorMessage, clearError } = useGame();

  const [grid, setGrid] = useState<Cell[][]>(createEmptyGrid);
  const [placedShips, setPlacedShips] = useState<ShipPlacementEntry[]>([]);
  const [selectedShip, setSelectedShip] = useState<ShipType | null>(null);
  const [isHorizontal, setIsHorizontal] = useState(true);
  const [hoverCells, setHoverCells] = useState<Position[]>([]);
  const [hoverValid, setHoverValid] = useState(true);

  const placedTypes = new Set(placedShips.map((s) => s.type));
  const unplacedShips = Object.values(ShipType).filter((t) => !placedTypes.has(t));

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!selectedShip) return;

      const size = SHIP_SIZES[selectedShip];
      if (!isValidPlacement(grid, size, row, col, isHorizontal)) return;

      const positions: Position[] = [];
      const newGrid = grid.map((r) => r.map((c) => ({ ...c })));

      for (let i = 0; i < size; i++) {
        const r = isHorizontal ? row : row + i;
        const c = isHorizontal ? col + i : col;
        positions.push({ row: r, col: c });
        newGrid[r][c].status = CellStatus.Occupied;
        newGrid[r][c].shipId = selectedShip;
      }

      setGrid(newGrid);
      setPlacedShips((prev) => [
        ...prev,
        { type: selectedShip, positions, orientation: isHorizontal ? "horizontal" : "vertical" },
      ]);
      setSelectedShip(null);
      setHoverCells([]);
    },
    [selectedShip, grid, isHorizontal]
  );

  const handleCellHover = useCallback(
    (row: number, col: number) => {
      if (!selectedShip) {
        setHoverCells([]);
        return;
      }

      const size = SHIP_SIZES[selectedShip];
      const valid = isValidPlacement(grid, size, row, col, isHorizontal);
      setHoverValid(valid);

      if (!valid) {
        setHoverCells([]);
        return;
      }

      const positions: Position[] = [];
      for (let i = 0; i < size; i++) {
        const r = isHorizontal ? row : row + i;
        const c = isHorizontal ? col + i : col;
        positions.push({ row: r, col: c });
      }
      setHoverCells(positions);
    },
    [selectedShip, grid, isHorizontal]
  );

  const handleRemoveShip = useCallback(
    (shipType: ShipType) => {
      const ship = placedShips.find((s) => s.type === shipType);
      if (!ship) return;

      const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
      for (const pos of ship.positions) {
        newGrid[pos.row][pos.col].status = CellStatus.Empty;
        newGrid[pos.row][pos.col].shipId = null;
      }
      setGrid(newGrid);
      setPlacedShips((prev) => prev.filter((s) => s.type !== shipType));
    },
    [grid, placedShips]
  );

  const allPlaced = placedShips.length === Object.values(ShipType).length;

  const handleReady = () => {
    if (!allPlaced) return;

    const ships: Ship[] = placedShips.map((entry) => ({
      id: entry.type,
      type: entry.type,
      size: SHIP_SIZES[entry.type],
      position: entry.positions,
      hits: new Array(entry.positions.length).fill(false),
      sunk: false,
    }));

    placeShips(ships);
    setReady();
  };

  if (isWaitingForOpponent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-3xl font-bold">Waiting for Opponent</h1>
        <p className="text-lg text-gray-400">
          Your ships are placed. Waiting for opponent to finish...
        </p>
      </div>
    );
  }

  const hoverSet = new Set(hoverCells.map((p) => `${p.row},${p.col}`));

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <h1 className="text-3xl font-bold">Place Your Ships</h1>
      <p className="text-gray-400">Room: {roomCode} | Player: {playerName}</p>

      {errorMessage && (
        <div className="bg-red-600/20 border border-red-600 rounded px-4 py-2 flex items-center gap-2">
          <span>{errorMessage}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-300 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Ship Palette */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-gray-400 mr-2">Your Ships:</span>
        {unplacedShips.map((type) => (
          <button
            key={type}
            onClick={() =>
              setSelectedShip(selectedShip === type ? null : type)
            }
            className={`px-4 py-2 rounded text-sm border ${
              selectedShip === type
                ? "bg-yellow-500 text-black border-yellow-600"
                : "bg-gray-700 border-gray-600 hover:bg-gray-600"
            }`}
          >
            {type} ({SHIP_SIZES[type]})
          </button>
        ))}
        <button
          onClick={() => setIsHorizontal((p) => !p)}
          className="px-4 py-2 rounded text-sm bg-gray-700 border border-gray-600 hover:bg-gray-600"
        >
          Rotate: {isHorizontal ? "Horizontal" : "Vertical"}
        </button>
      </div>

      {/* Placed Ships List */}
      {placedShips.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-gray-400">Placed:</span>
          {placedShips.map((s) => (
            <button
              key={s.type}
              onClick={() => handleRemoveShip(s.type)}
              className="px-3 py-1 rounded text-sm bg-green-700 border border-green-600 hover:bg-red-700"
              title="Click to remove"
            >
              {s.type}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-10 gap-0.5 w-fit">
        {grid.flat().map((cell) => {
          const isHover = hoverSet.has(`${cell.row},${cell.col}`);
          const bg = isHover
            ? hoverValid
              ? "bg-green-500 border-green-400"
              : "bg-red-500 border-red-400"
            : getCellColor(cell.status);
          return (
            <button
              key={`${cell.row}-${cell.col}`}
              className={`w-10 h-10 border ${bg} transition-colors`}
              onClick={() => handleCellClick(cell.row, cell.col)}
              onMouseEnter={() => handleCellHover(cell.row, cell.col)}
              onMouseLeave={() => setHoverCells([])}
            />
          );
        })}
      </div>

      <button
        onClick={handleReady}
        disabled={!allPlaced}
        className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-lg"
      >
        Ready
      </button>
    </div>
  );
}
