import React from "react";
import { RECONNECT_TIMEOUT_SECONDS } from "shared";

interface DisconnectTimerProps {
  countdown: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const DisconnectTimer: React.FC<DisconnectTimerProps> = ({
  countdown,
}) => {
  const pct = countdown / RECONNECT_TIMEOUT_SECONDS;
  const isCritical = countdown <= 15;
  const isWarning = countdown <= 30;
  const isExpired = countdown <= 0;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center gap-3"
    >
      <div
        className={[
          "flex flex-col items-center gap-2 px-6 py-4 rounded-sm border transition-colors duration-500",
          isExpired && "border-danger-500/40 bg-danger-600/10",
          isCritical && !isExpired && "border-danger-500/30 bg-danger-600/5",
          isWarning && !isCritical && !isExpired && "border-brass-500/30 bg-brass-600/5",
          !isWarning && !isCritical && !isExpired && "border-navy-600/40 bg-navy-800/30",
        ].join(" ")}
      >
        <span className="font-display text-sm tracking-wide text-navy-200/80">
          {isExpired
            ? "Opponent failed to reconnect"
            : "Opponent disconnected"}
        </span>

        <span
          className={[
            "font-mono text-3xl tracking-[0.15em] tabular-nums transition-colors duration-300",
            isExpired && "text-danger-400",
            isCritical && !isExpired && "text-danger-400 animate-countdown-pulse",
            isWarning && !isCritical && "text-brass-400",
            !isWarning && "text-sonar-400",
          ].join(" ")}
        >
          {formatTime(Math.max(0, countdown))}
        </span>

        <span
          className={[
            "font-mono text-[0.6rem] tracking-[0.15em] uppercase transition-colors duration-300",
            isExpired && "text-danger-500/80",
            !isExpired && "text-navy-400/60",
          ].join(" ")}
        >
          {isExpired ? "Game over" : "reconnecting..."}
        </span>
      </div>

      {!isExpired && (
        <div className="w-full max-w-[16rem] h-1 rounded-full bg-navy-800/60 overflow-hidden">
          <div
            className={[
              "h-full rounded-full transition-all duration-1000 ease-linear",
              isCritical ? "bg-danger-500" : isWarning ? "bg-brass-500" : "bg-sonar-500",
            ].join(" ")}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};
