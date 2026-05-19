import React from "react";

interface TurnIndicatorProps {
  isMyTurn: boolean;
  playerName: string;
  opponentName: string;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  isMyTurn,
  playerName,
  opponentName,
}) => {
  return (
    <div className="relative flex items-center justify-center" aria-live="polite">
      <div
        className={[
          "relative flex items-center gap-4 px-6 py-2.5 rounded-sm border transition-all duration-500",
          isMyTurn
            ? "border-brass-500/40 bg-brass-600/8 animate-pulse-sonar"
            : "border-navy-600/40 bg-navy-800/30",
        ].join(" ")}
      >
        {isMyTurn && (
          <span className="absolute inset-0 rounded-sm bg-[radial-gradient(ellipse_at_center,rgba(196,163,67,0.06)_0%,transparent_70%)]" />
        )}

        <span
          aria-hidden="true"
          className={[
            "w-2 h-2 rounded-full flex-shrink-0",
            isMyTurn ? "bg-brass-400 shadow-[0_0_6px_rgba(196,163,67,0.5)]" : "bg-navy-600",
          ].join(" ")}
        />

        <div className="flex items-center gap-2 min-w-0">
          <span
            className={[
              "font-mono text-xs tracking-[0.15em] uppercase",
              isMyTurn ? "text-brass-300" : "text-navy-400",
            ].join(" ")}
          >
            {isMyTurn ? "Your Turn" : "Opponent's Turn"}
          </span>

          <span className="text-navy-500/50 font-mono text-[0.6rem]">|</span>

          <span className="font-display text-sm tracking-wide text-navy-300/80 truncate">
            {playerName}
            <span className="text-navy-500/50 mx-1.5">vs</span>
            {opponentName}
          </span>
        </div>

        {!isMyTurn && (
          <span
            aria-hidden="true"
            className="flex gap-1 ml-1"
          >
            <span className="w-1 h-1 rounded-full bg-navy-500 animate-pulse [animation-delay:0ms]" />
            <span className="w-1 h-1 rounded-full bg-navy-500 animate-pulse [animation-delay:150ms]" />
            <span className="w-1 h-1 rounded-full bg-navy-500 animate-pulse [animation-delay:300ms]" />
          </span>
        )}
      </div>
    </div>
  );
};
