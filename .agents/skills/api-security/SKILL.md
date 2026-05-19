---
name: api-security
description: Security hardening for Express + Socket.IO game servers. Covers input validation, rate limiting, authorization, error handling, and anti-patterns for real-time multiplayer game backends.
---

# API Security for Express + Socket.IO Game Servers

Apply these patterns when building or hardening real-time multiplayer game backends. Every pattern assumes Socket.IO over Express — apply defensively, never trust the client.

## 1. Input Validation

Validate every Socket.IO event payload. Reject malformed data before it touches game logic.

```typescript
// validation.ts
const COORD_REGEX = /^[0-9]$/;

interface AttackPayload {
  row: string;
  col: string;
}

function validateAttack(payload: unknown): AttackPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid payload: expected object");
  }
  const { row, col } = payload as Record<string, unknown>;
  if (typeof row !== "string" || !COORD_REGEX.test(row)) {
    throw new Error("Invalid coordinate: row must be digit 0–9");
  }
  if (typeof col !== "string" || !COORD_REGEX.test(col)) {
    throw new Error("Invalid coordinate: col must be digit 0–9");
  }
  return { row, col };
}

interface JoinPayload {
  roomCode: string;
  playerId: string;
}

function validateJoin(payload: unknown): JoinPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid payload: expected object");
  }
  const { roomCode, playerId } = payload as Record<string, unknown>;
  if (typeof roomCode !== "string" || !/^[A-Z]{4}$/.test(roomCode)) {
    throw new Error("Invalid room code: must be 4 uppercase letters");
  }
  if (typeof playerId !== "string" || playerId.length === 0) {
    throw new Error("Invalid player ID");
  }
  return { roomCode, playerId };
}
```

## 2. Rate Limiting

Per-player cooldowns prevent event spam and rapid-fire attacks.

```typescript
// rate-limiter.ts
const cooldowns = new Map<string, number>();

function checkCooldown(playerId: string, event: string, ms: number): boolean {
  const key = `${playerId}:${event}`;
  const last = cooldowns.get(key) ?? 0;
  const now = Date.now();
  if (now - last < ms) return false;
  cooldowns.set(key, now);
  return true;
}

// In socket handler:
socket.on("attack", (payload) => {
  try {
    const { row, col } = validateAttack(payload);
    if (!checkCooldown(socket.data.playerId, "attack", 2000)) {
      socket.emit("error", { message: "Wait before attacking again" });
      return;
    }
    // ... process attack
  } catch (err) {
    socket.emit("error", { message: (err as Error).message });
  }
});
```

## 3. Authorization Middleware

Socket.IO middleware verifies identity and room membership before processing events.

```typescript
// auth-middleware.ts
import { Server, Socket } from "socket.io";

const rooms = new Map<string, { players: Set<string>; turn: string }>();

export function registerAuthMiddleware(io: Server): void {
  io.use((socket, next) => {
    const { roomCode, playerId } = socket.handshake.auth as Record<string, unknown>;

    try {
      const { roomCode: validCode, playerId: validId } = validateJoin({
        roomCode,
        playerId,
      });
      socket.data.roomCode = validCode;
      socket.data.playerId = validId;
      next();
    } catch (err) {
      next(new Error((err as Error).message));
    }
  });
}

export function requireRoomMembership(
  socket: Socket,
  next: (err?: Error) => void
): void {
  const room = rooms.get(socket.data.roomCode);
  if (!room || !room.players.has(socket.data.playerId)) {
    next(new Error("Not in room"));
    return;
  }
  next();
}

export function requireTurn(socket: Socket): boolean {
  const room = rooms.get(socket.data.roomCode);
  if (!room || room.turn !== socket.data.playerId) {
    socket.emit("error", { message: "Not your turn" });
    return false;
  }
  return true;
}
```

## 4. Error Handling

Never leak internals. Always return a consistent `{ message: string }` shape.

```typescript
// errors.ts
export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameError";
  }
}

// Global handler:
export function handleError(socket: Socket, err: Error): void {
  if (err instanceof GameError) {
    socket.emit("error", { message: err.message });
    return;
  }
  console.error("Unexpected error:", err);
  socket.emit("error", { message: "Something went wrong" });
}

// Usage:
socket.on("place_ships", (payload) => {
  try {
    if (!requireTurn(socket)) return;
    // ...
  } catch (err) {
    handleError(socket, err as Error);
  }
});
```

## 5. Resource Protection

Prevent resource exhaustion with sensible caps and cleanup.

```typescript
// resource-guard.ts
const MAX_ROOMS = 100;
const MAX_PLAYERS_PER_ROOM = 2;
const CONNECTION_TIMEOUT_MS = 30_000;
const GAME_TIMEOUT_MS = 30 * 60_000; // 30 min

function guardRoomCreation(): void {
  if (rooms.size >= MAX_ROOMS) {
    throw new GameError("Server at capacity, try again later");
  }
}

function guardPlayerJoin(roomCode: string): void {
  const room = rooms.get(roomCode);
  if (!room) throw new GameError("Room not found");
  if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
    throw new GameError("Room is full");
  }
}

// Timeout hanging connections:
socket.on("connection", (s) => {
  const timeout = setTimeout(() => {
    s.emit("error", { message: "Connection timed out" });
    s.disconnect(true);
  }, CONNECTION_TIMEOUT_MS);

  s.on("disconnect", () => {
    clearTimeout(timeout);
    cleanupPlayerState(s.data.playerId, s.data.roomCode);
  });
});

// Garbage collect stale games:
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.createdAt > GAME_TIMEOUT_MS) {
      rooms.delete(code);
    }
  }
}, 60_000);
```

## 6. Immutable State Transitions

Never mutate game state in place. Return new state on every action.

```typescript
// state.ts
interface GameState {
  board: string[][];
  turn: string;
  hits: number;
}

function processAttack(state: GameState, row: number, col: number): GameState {
  const newBoard = state.board.map((r, ri) =>
    ri === row ? r.map((cell, ci) => (ci === col ? "X" : cell)) : r
  );
  return {
    ...state,
    board: newBoard,
    hits: state.hits + 1,
    turn: state.turn === "p1" ? "p2" : "p1",
  };
}
```

## Anti-Patterns

| ❌ Avoid | ✅ Do Instead |
|---|---|
| Trusting client-sent data without validation | Validate every payload against a schema |
| `socket.handshake.auth.password` | Use a token-based flow, never pass secrets in handshake |
| `socket.broadcast.to("room").emit("error", err.stack)` | Never leak stack traces or internal errors |
| Forgetting to remove listeners on disconnect | Clean up `socket.on(...)` in `disconnect` handler |
| `rooms.set(room)` without a TTL | Set a creation timestamp, reap expired rooms on interval |
| `socket.emit("game_state", state)` (mutable) | Always serialize, never return mutable references |
| Catching errors without emitting | Always send a properly formatted error to the client |

## Best Practices Summary

1. **Socket.IO middleware** — validate auth, room membership, and turn order before processing
2. **Validate at the edge** — every event handler starts with `validate*()` then `checkCooldown()`
3. **Consistent error shape** — `{ message: string }` only, no stack traces ever
4. **Immutable state** — spread and return, never mutate in place
5. **Resource caps** — max rooms, max players, connection timeout, game TTL
6. **Cleanup on disconnect** — remove timers, free state, notify opponent
