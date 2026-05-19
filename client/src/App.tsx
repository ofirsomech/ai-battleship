import { GameProvider } from "./state/gameContext";
import AppShell from "./AppShell";

export default function App() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  );
}
