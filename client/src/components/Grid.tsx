import React, { useCallback } from "react";
import type { Cell as CellData } from "shared";
import { Cell } from "./Cell.js";

interface GridProps {
  cells: CellData[][];
  onCellClick?: (row: number, col: number) => void;
  interactive?: boolean;
  showShips?: boolean;
  label: string;
  onCellHover?: (row: number, col: number) => void;
  onCellHoverEnd?: () => void;
}

const COLUMN_LABELS = "ABCDEFGHIJ";
const ROW_LABELS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export const Grid: React.FC<GridProps> = ({
  cells,
  onCellClick,
  interactive = false,
  showShips = false,
  label,
  onCellHover,
  onCellHoverEnd,
}) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const row = target.getAttribute("data-row");
      const col = target.getAttribute("data-col");
      if (row == null || col == null) return;

      const r = Number(row);
      const c = Number(col);

      let nextR = r;
      let nextC = c;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          nextR = Math.max(0, r - 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          nextR = Math.min(9, r + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          nextC = Math.max(0, c - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          nextC = Math.min(9, c + 1);
          break;
        default:
          return;
      }

      const el = document.querySelector(
        `[data-row="${nextR}"][data-col="${nextC}"]`
      ) as HTMLElement | null;
      el?.focus();
    },
    []
  );

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <span className="font-mono text-xs tracking-[0.2em] uppercase text-navy-400/60 mb-0.5">
        {label}
      </span>

      <div
        role="grid"
        aria-label={label}
        className="grid gap-px rounded-sm overflow-hidden border border-navy-600/50 bg-navy-950/50"
        style={{
          gridTemplateColumns: `auto repeat(10, minmax(2rem, 3.5rem))`,
          gridTemplateRows: `auto repeat(10, minmax(2rem, 3.5rem))`,
        }}
        onKeyDown={handleKeyDown}
      >
        <div aria-hidden="true" />

        {COLUMN_LABELS.split("").map((col) => (
          <div
            key={`header-${col}`}
            aria-hidden="true"
            role="columnheader"
            className="flex items-center justify-center font-mono text-[0.65rem] tracking-widest text-navy-400/50 uppercase bg-navy-900/60 py-0.5"
          >
            {col}
          </div>
        ))}

        {cells.map((rowCells, rowIdx) => (
          <React.Fragment key={`row-${rowIdx}`}>
            <div
              aria-hidden="true"
              role="rowheader"
              className="flex items-center justify-center font-mono text-[0.65rem] tracking-widest text-navy-400/50 bg-navy-900/60 px-1.5"
            >
              {ROW_LABELS[rowIdx]}
            </div>

            {rowCells.map((cell) => {
              const isOccupiedShip = cell.status === "occupied" && showShips;
              const isCellInteractive =
                interactive &&
                cell.status !== "hit" &&
                cell.status !== "miss" &&
                !!onCellClick;

              return (
                <Cell
                  key={`${cell.row}-${cell.col}`}
                  cell={cell}
                  onClick={
                    isCellInteractive
                      ? () => onCellClick?.(cell.row, cell.col)
                      : undefined
                  }
                  disabled={!isCellInteractive}
                  showShip={isOccupiedShip}
                  isTargeted={isCellInteractive}
                  onPointerEnter={
                    onCellHover ? () => onCellHover(cell.row, cell.col) : undefined
                  }
                  onPointerLeave={onCellHoverEnd}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
