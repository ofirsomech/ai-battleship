import { describe, it, expect } from "vitest";
import { createShips, placeShip, isPlacementValid, validatePlacement, allShipsPlaced } from "../ship.js";
import { ShipType, SHIP_SIZES } from "shared";

describe("createShips", () => {
  it("returns 5 ships with correct types and sizes", () => {
    const ships = createShips();
    expect(ships).toHaveLength(5);

    const expectedTypes = [
      ShipType.Carrier,
      ShipType.Battleship,
      ShipType.Cruiser,
      ShipType.Submarine,
      ShipType.Destroyer,
    ];

    ships.forEach((ship, i) => {
      expect(ship.type).toBe(expectedTypes[i]);
      expect(ship.size).toBe(SHIP_SIZES[expectedTypes[i]]);
      expect(ship.position).toEqual([]);
      expect(ship.hits).toHaveLength(ship.size);
      expect(ship.hits.every((h) => h === false)).toBe(true);
      expect(ship.sunk).toBe(false);
    });
  });
});

describe("placeShip", () => {
  it("places a ship horizontally", () => {
    const ships = createShips();
    const destroyer = ships.find((s) => s.type === ShipType.Destroyer)!;
    const placed = placeShip(destroyer, { row: 0, col: 0 }, false);
    expect(placed.position).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);
    expect(destroyer.position).toEqual([]);
  });

  it("places a ship vertically", () => {
    const ships = createShips();
    const submarine = ships.find((s) => s.type === ShipType.Submarine)!;
    const placed = placeShip(submarine, { row: 5, col: 3 }, true);
    expect(placed.position).toEqual([
      { row: 5, col: 3 },
      { row: 6, col: 3 },
      { row: 7, col: 3 },
    ]);
  });

  it("places a carrier horizontally at edge", () => {
    const ships = createShips();
    const carrier = ships.find((s) => s.type === ShipType.Carrier)!;
    const placed = placeShip(carrier, { row: 0, col: 5 }, false);
    expect(placed.position).toHaveLength(5);
    expect(placed.position[4]).toEqual({ row: 0, col: 9 });
  });

  it("throws when horizontal placement goes out of bounds", () => {
    const ships = createShips();
    const carrier = ships.find((s) => s.type === ShipType.Carrier)!;
    expect(() => placeShip(carrier, { row: 0, col: 6 }, false)).toThrow("out of bounds");
  });

  it("throws when vertical placement goes out of bounds", () => {
    const ships = createShips();
    const carrier = ships.find((s) => s.type === ShipType.Carrier)!;
    expect(() => placeShip(carrier, { row: 7, col: 0 }, true)).toThrow("out of bounds");
  });
});

describe("isPlacementValid", () => {
  it("returns true for valid placement within grid with no overlap", () => {
    const occupied = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
    expect(isPlacementValid({ row: 1, col: 0 }, 3, false, occupied)).toBe(true);
  });

  it("returns false for overlapping placement", () => {
    const occupied = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
    expect(isPlacementValid({ row: 0, col: 1 }, 3, false, occupied)).toBe(false);
  });

  it("returns false for out-of-bounds placement", () => {
    expect(isPlacementValid({ row: 9, col: 8 }, 3, false, [])).toBe(false);
  });

  it("returns true for edge placement that fits", () => {
    expect(isPlacementValid({ row: 9, col: 9 }, 1, false, [])).toBe(true);
  });
});

describe("validatePlacement", () => {
  it("returns true when position is not occupied", () => {
    const occupied = [{ row: 0, col: 0 }];
    expect(validatePlacement({ row: 1, col: 2 }, occupied)).toBe(true);
  });

  it("returns false when position is occupied", () => {
    const occupied = [{ row: 0, col: 0 }, { row: 1, col: 2 }];
    expect(validatePlacement({ row: 1, col: 2 }, occupied)).toBe(false);
  });
});

describe("allShipsPlaced", () => {
  it("returns true when all ships have positions", () => {
    const ships = createShips();
    const placedShips = ships.map((s) =>
      placeShip(s, { row: 0, col: 0 }, false)
    );
    expect(allShipsPlaced(placedShips)).toBe(true);
  });

  it("returns false when no ships have positions", () => {
    const ships = createShips();
    expect(allShipsPlaced(ships)).toBe(false);
  });

  it("returns false when only some ships are placed", () => {
    const ships = createShips();
    const placed = ships.map((s, i) =>
      i < 3 ? placeShip(s, { row: i, col: 0 }, false) : s
    );
    expect(allShipsPlaced(placed)).toBe(false);
  });
});
