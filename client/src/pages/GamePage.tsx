import { useGame } from "../state/gameContext";
import { Grid, TurnIndicator, DisconnectTimer, ShipSunkNotification } from "../components/index.js";
import type { ShipType } from "shared";

export default function GamePage() {
  const {
    playerId,
    playerName,
    currentTurn,
    yourGrid,
    opponentGrid,
    disconnectCountdown,
    lastSunkShip,
    clearSunkShip,
    attackCell,
  } = useGame();

  const isMyTurn = currentTurn === playerId;

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <TurnIndicator
        isMyTurn={isMyTurn}
        playerName={playerName}
        opponentName="Opponent"
      />

      {disconnectCountdown !== null && (
        <DisconnectTimer countdown={disconnectCountdown} />
      )}

      {lastSunkShip && (
        <ShipSunkNotification
          shipType={lastSunkShip as ShipType}
          visible={true}
          onDismiss={clearSunkShip}
        />
      )}

      <div className="flex flex-wrap gap-8 justify-center">
        <Grid
          cells={yourGrid}
          showShips={true}
          interactive={false}
          label="Your Fleet"
        />

        <Grid
          cells={opponentGrid}
          showShips={false}
          interactive={isMyTurn}
          onCellClick={attackCell}
          label="Enemy Waters"
        />
      </div>
    </div>
  );
}
