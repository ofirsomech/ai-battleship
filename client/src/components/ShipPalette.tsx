import React from "react";
import { ShipType, SHIP_SIZES } from "shared";
import type { Ship } from "shared";

interface ShipPaletteProps {
  ships: Ship[];
  selectedShipType: ShipType | null;
  onSelectShip: (type: ShipType) => void;
  vertical: boolean;
}

const SHIP_LABELS: Record<ShipType, string> = {
  [ShipType.Carrier]: "Carrier",
  [ShipType.Battleship]: "Battleship",
  [ShipType.Cruiser]: "Cruiser",
  [ShipType.Submarine]: "Submarine",
  [ShipType.Destroyer]: "Destroyer",
};

const SHIP_ORDER: ShipType[] = [
  ShipType.Carrier,
  ShipType.Battleship,
  ShipType.Cruiser,
  ShipType.Submarine,
  ShipType.Destroyer,
];

function getShipEmoji(type: ShipType): string {
  switch (type) {
    case ShipType.Carrier:
      return "\u26F5";
    case ShipType.Battleship:
      return "\u26F4";
    case ShipType.Cruiser:
      return "\u2693";
    case ShipType.Submarine:
      return "\u{1F6A2}";
    case ShipType.Destroyer:
      return "\u{1F6F3}";
  }
}

export const ShipPalette: React.FC<ShipPaletteProps> = ({
  ships,
  selectedShipType,
  onSelectShip,
  vertical,
}) => {
  const placedTypes = new Set(
    ships.filter((s) => s.position.length > 0).map((s) => s.type)
  );

  return (
    <div className="flex flex-col gap-2 w-full" role="listbox" aria-label="Ship palette">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-navy-400/60">
          Fleet
        </span>
        <span className="font-mono text-[0.6rem] tracking-wider text-navy-400/50">
          {vertical ? "\u2195 Vertical" : "\u2194 Horizontal"}
        </span>
      </div>

      {SHIP_ORDER.map((type) => {
        const ship = ships.find((s) => s.type === type);
        const placed = placedTypes.has(type);
        const isSelected = selectedShipType === type;
        const size = SHIP_SIZES[type];

        return (
          <button
            key={type}
            type="button"
            role="option"
            aria-selected={isSelected}
            aria-disabled={placed || undefined}
            disabled={placed}
            onClick={() => onSelectShip(type)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectShip(type);
              }
            }}
            className={[
              "flex items-center gap-3 w-full px-3 py-2 rounded-sm border transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sonar-500 focus-visible:ring-offset-1 focus-visible:ring-offset-navy-900",
              isSelected &&
                !placed &&
                "border-brass-500 bg-brass-600/10 shadow-brass-glow",
              !isSelected && !placed && "border-navy-600/60 bg-navy-800/30",
              placed && "border-navy-700/30 bg-navy-800/20 opacity-50 cursor-default",
              !placed && !isSelected && "hover:border-sonar-500/30 hover:bg-navy-700/40",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="text-lg w-6 text-center" aria-hidden="true">
              {getShipEmoji(type)}
            </span>

            <div className="flex flex-col items-start min-w-0">
              <span
                className={[
                  "font-display text-sm tracking-wide leading-tight",
                  placed ? "text-navy-500" : "text-navy-100",
                  isSelected && !placed && "text-brass-300",
                ].join(" ")}
              >
                {SHIP_LABELS[type]}
              </span>

              <span className="flex gap-0.5 mt-1">
                {Array.from({ length: size }).map((_, i) => (
                  <span
                    key={i}
                    className={[
                      "w-2 h-2 rounded-sm border transition-colors",
                      placed && "bg-navy-600/50 border-navy-600/30",
                      !placed && isSelected && "bg-brass-500 border-brass-400",
                      !placed &&
                        !isSelected &&
                        "bg-navy-600 border-navy-500",
                    ].join(" ")}
                  />
                ))}
              </span>
            </div>

            {placed && (
              <span className="ml-auto text-navy-500 text-xs font-mono" aria-hidden="true">
                \u2713
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
