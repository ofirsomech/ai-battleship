# AI Battleship

A multiplayer, real-time Battleship game for two players, built with TypeScript, React, Socket.IO, and TailwindCSS.

## Architecture

```
ai-battleship/
├── shared/          # Shared TypeScript types & enums
│   └── src/         # Re-export barrel
├── server/          # Express + Socket.IO game server (port 3001)
├── client/          # React 18 + Vite + TailwindCSS (port 5173)
└── docs/            # Game spec & API contract
```

- **shared** — all types (`Cell`, `Ship`, `Player`, `GameState`, `AttackResult`, `RoomInfo`) and enums (`ShipType`, `GamePhase`, `CellStatus`) live here. Both client and server consume via workspace dependency.
- **server** — Express HTTP server with Socket.IO. In-memory game state per room. Handles room creation, ship placement, turn-based attacks, disconnection countdowns.
- **client** — Vite + React SPA. Two grids (own + opponent), ship palette with drag-and-drop placement, turn indicators, real-time attack feedback.

## Getting Started

### Install

```bash
npm install
```

Uses npm workspaces — installs dependencies for all packages.

### Development

```bash
# Terminal 1 — start the game server (port 3001)
npm run dev:server

# Terminal 2 — start the client dev server (port 5173)
npm run dev:client
```

### Build

```bash
npm run build
```

### Type Check

```bash
npm run typecheck
```

### Test

```bash
npm test
```

## Game Flow

1. Player 1 creates a room → gets a room code
2. Player 2 joins with the room code
3. Both players place their 5 ships on a 10×10 grid
4. Both click Ready → game starts
5. Players take turns attacking opponent cells
6. First to sink all 5 opponent ships wins
7. Disconnected players have 60 seconds to reconnect
