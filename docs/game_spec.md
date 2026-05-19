# Battleship Game Specification

## Overview
A multiplayer, real-time Battleship game for two players, played in the browser.

---

## Game Rules

### Setup
1. Each player places 5 ships on a 10x10 grid (rows 0-9, columns 0-9).
2. Ships cannot overlap, must be placed entirely within the grid, and may be oriented horizontally or vertically.
3. Ship sizes:
   - Carrier (5 cells)
   - Battleship (4 cells)
   - Cruiser (3 cells)
   - Submarine (3 cells)
   - Destroyer (2 cells)

### Gameplay
4. Players take alternating turns. The player who created the room goes first.
5. On their turn, a player selects one cell on the opponent's grid to attack.
6. The opponent's grid is hidden; only hits, misses, and sunk ships are revealed.
7. Attack results:
   - **Miss**: The selected cell is empty. Turn ends.
   - **Hit**: A ship occupies the selected cell. Turn ends.
   - **Sunk**: All cells of a ship have been hit. The ship is revealed. Turn ends.
8. A player cannot attack a cell they have already attacked.

### Win Condition
9. A player wins by sinking all 5 of their opponent's ships.

### Lobby & Connection
10. Players join a game room via a room code.
11. The game begins when both players have joined and placed all ships.
12. If a player disconnects, they have 60 seconds to reconnect. If they fail to reconnect, the remaining player wins.
13. Players cannot join a room that already has 2 players.
14. Players cannot rejoin a finished game.

---

## Acceptance Criteria

### AC-01: Room Creation
- A player can create a new game room and receive a room code.
- The room code is shareable (copy to clipboard).

### AC-02: Room Joining
- A second player can join an existing room using the room code.
- Invalid/expired room codes show an error message.

### AC-03: Ship Placement
- Each player sees a 10x10 grid and a ship palette.
- Ships can be placed via drag-and-drop or click-to-place with rotation.
- Invalid placements (overlap, out-of-bounds) are visually rejected.
- A "Ready" button activates only after all 5 ships are placed.

### AC-04: Game Start
- The game begins automatically when both players are ready.
- The first player (room creator) sees their turn highlighted.

### AC-05: Turn-Based Attacks
- On their turn, a player clicks a cell on the opponent's grid.
- A hit is visually distinct from a miss.
- After the attack result, the turn switches to the opponent.
- Players cannot interact with the opponent grid during the opponent's turn.

### AC-06: Ship Sinking
- When all cells of a ship are hit, the ship is revealed on the opponent's grid and marked as sunk.
- A notification appears: "You sunk their [Ship Name]!"

### AC-07: Win Condition
- When all 5 opponent ships are sunk, the winner sees a victory screen.
- The loser sees a defeat screen.
- Scores/statistics (total moves, accuracy) are displayed.

### AC-08: Disconnection Handling
- If a player disconnects, the opponent is notified and a 60-second countdown begins.
- If the player reconnects within 60 seconds, the game resumes.
- If the countdown expires, the remaining player wins.

### AC-09: Spectator/Full Rooms
- Attempting to join a room that already has 2 players shows an error.

### AC-10: Rejoin Protection
- Attempting to rejoin a finished game shows an error.

---

## Non-Functional Requirements

- **Real-time**: All game events propagate via Socket.IO within 500ms.
- **State**: In-memory only. No persistence.
- **Responsive**: Works on desktop (primary) and tablet.
- **Accessibility**: Keyboard-navigable grids, ARIA labels on cells.
