import { Ship, ShipType, SHIP_SIZES, Position, GRID_SIZE } from "shared";

const SHIP_TYPE_ORDER: ShipType[] = [
  ShipType.Carrier,
  ShipType.Battleship,
  ShipType.Cruiser,
  ShipType.Submarine,
  ShipType.Destroyer,
];

export function createShips(): Ship[] {
  return SHIP_TYPE_ORDER.map((type) => {
    const size = SHIP_SIZES[type];
    return {
      id: type,
      type,
      size,
      position: [],
      hits: new Array(size).fill(false),
      sunk: false,
    };
  });
}

function calculatePositions(
  start: Position,
  size: number,
  vertical: boolean
): Position[] {
  const positions: Position[] = [];
  for (let i = 0; i < size; i++) {
    const row = vertical ? start.row + i : start.row;
    const col = vertical ? start.col : start.col + i;
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
      throw new Error("Ship placement out of bounds");
    }
    positions.push({ row, col });
  }
  return positions;
}

export function placeShip(ship: Ship, start: Position, vertical: boolean): Ship {
  const positions = calculatePositions(start, ship.size, vertical);
  return { ...ship, position: positions };
}

export function validatePlacement(
  position: Position,
  occupiedCells: Position[]
): boolean {
  return !occupiedCells.some(
    (cell) => cell.row === position.row && cell.col === position.col
  );
}

export function isPlacementValid(
  start: Position,
  size: number,
  vertical: boolean,
  occupiedCells: Position[]
): boolean {
  for (let i = 0; i < size; i++) {
    const row = vertical ? start.row + i : start.row;
    const col = vertical ? start.col : start.col + i;
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
      return false;
    }
    if (
      occupiedCells.some((cell) => cell.row === row && cell.col === col)
    ) {
      return false;
    }
  }
  return true;
}

export function allShipsPlaced(ships: Ship[]): boolean {
  return ships.every((ship) => ship.position.length > 0);
}
