import React, { useEffect, useRef, useState } from "react";
import type { ShipType } from "shared";

interface ShipSunkNotificationProps {
  shipType: ShipType;
  visible: boolean;
  onDismiss: () => void;
}

const SHIP_EMOJI: Record<string, string> = {
  Carrier: "\u26F5",
  Battleship: "\u26F4",
  Cruiser: "\u2693",
  Submarine: "\u{1F6A2}",
  Destroyer: "\u{1F6F3}",
};

export const ShipSunkNotification: React.FC<ShipSunkNotificationProps> = ({
  shipType,
  visible,
  onDismiss,
}) => {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (visible) {
      setExiting(false);
      timerRef.current = setTimeout(() => {
        setExiting(true);
        setTimeout(onDismiss, 300);
      }, 3000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, shipType, onDismiss]);

  if (!visible && !exiting) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        "fixed top-4 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-3 px-5 py-3 rounded-sm border",
        "bg-hit-600/10 border-hit-500/40 backdrop-blur-sm shadow-lg shadow-hit-700/10",
        !exiting ? "animate-slide-in-down" : "animate-slide-out-up",
      ].join(" ")}
    >
      <span className="text-2xl" aria-hidden="true">
        {SHIP_EMOJI[shipType] ?? "\u{1F6A2}"}
      </span>

      <div className="flex flex-col">
        <span className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-hit-400/70">
          Ship Sunk
        </span>
        <span className="font-display text-base tracking-wide text-navy-100">
          You sunk their {shipType}!
        </span>
      </div>

      <button
        type="button"
        onClick={() => {
          setExiting(true);
          setTimeout(onDismiss, 300);
        }}
        aria-label="Dismiss notification"
        className="ml-2 flex items-center justify-center w-6 h-6 rounded-sm text-navy-400 hover:text-navy-200 hover:bg-navy-700/50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sonar-500"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
