import React from "react";
import type { Cell as CellData } from "shared";

interface CellProps {
  cell: CellData;
  onClick?: () => void;
  disabled?: boolean;
  showShip?: boolean;
  isTargeted?: boolean;
}

const COLUMN_LABELS = "ABCDEFGHIJ";

function stateLabel(cell: CellData): string {
  switch (cell.status) {
    case "hit":
      return "Hit";
    case "miss":
      return "Miss";
    case "occupied":
      return "Ship";
    default:
      return "Empty";
  }
}

export const Cell: React.FC<CellProps> = ({
  cell,
  onClick,
  disabled = false,
  showShip = false,
  isTargeted = false,
}) => {
  const isClickable = onClick != null && !disabled;
  const { row, col, status } = cell;

  return (
    <button
      type="button"
      role="gridcell"
      tabIndex={0}
      aria-label={`${COLUMN_LABELS[col]}${row} - ${stateLabel(cell)}`}
      aria-disabled={disabled || undefined}
      disabled={!isClickable}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const el = document.querySelector(
            `[data-row="${Math.max(0, row - 1)}"][data-col="${col}"]`
          ) as HTMLElement | null;
          el?.focus();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const el = document.querySelector(
            `[data-row="${Math.min(9, row + 1)}"][data-col="${col}"]`
          ) as HTMLElement | null;
          el?.focus();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          const el = document.querySelector(
            `[data-row="${row}"][data-col="${Math.max(0, col - 1)}"]`
          ) as HTMLElement | null;
          el?.focus();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          const el = document.querySelector(
            `[data-row="${row}"][data-col="${Math.min(9, col + 1)}"]`
          ) as HTMLElement | null;
          el?.focus();
        }
      }}
      data-row={row}
      data-col={col}
      className={[
        "relative flex items-center justify-center w-full h-full",
        "border border-navy-700/60 transition-all duration-150",
        "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-sonar-500 focus-visible:ring-offset-1 focus-visible:ring-offset-navy-900 focus-visible:outline-none",
        status === "empty" && !showShip && "bg-navy-800/40",
        status === "empty" && "bg-navy-800/40",
        status === "hit" && "bg-hit-700/80 animate-hit-flash shadow-sm shadow-hit-500/30",
        status === "miss" && "bg-miss-600/30 animate-miss-ripple",
        status === "occupied" && showShip && "bg-navy-600/60 border-navy-500/80",
        isClickable && !disabled && "cursor-crosshair hover:bg-navy-600/50 hover:border-sonar-500/40",
        isTargeted && !disabled && "shadow-cell-target border-sonar-500/30",
        disabled && "cursor-default opacity-70",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {status === "hit" && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 text-hit-400 drop-shadow-[0_0_4px_rgba(255,107,53,0.6)]">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              d="M12 3l2 7h7l-5.5 4 2 7L12 17l-5.5 4 2-7L3 10h7z"
            />
          </svg>
        </span>
      )}

      {status === "miss" && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-2/5 h-2/5 text-miss-400/70">
            <circle cx="12" cy="12" r="4" fill="currentColor" />
          </svg>
        </span>
      )}
    </button>
  );
};
