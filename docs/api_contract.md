# API Contract — Socket.IO Events

## Client → Server Events

### `room:create`
Create a new game room.
- **emits** `{ playerName: string }`
- **ack callback** `{ roomCode: string }`

### `room:join`
Join an existing room by code.
- **emits** `{ roomCode: string, playerName: string }`
- **ack callback** `{ success: boolean, error?: string, roomCode?: string, playerId?: string }`

### `ship:place_all`
Submit all ship placements at once.
- **emits** `{ roomCode: string, ships: Ship[] }`
- **ack callback** `{ success: boolean, error?: string }`

### `player:ready`
Signal that the player has finished placing ships and is ready to start.
- **emits** `{ roomCode: string }`

### `attack:cell`
Attack a cell on the opponent's grid.
- **emits** `{ roomCode: string, row: number, col: number }`
- **ack callback** `{ result: AttackResult }`

### `game:reconnect`
Reconnect to an in-progress game after a disconnect.
- **emits** `{ roomCode: string, playerId: string }`
- **ack callback** `{ success: boolean, error?: string }`

### `player:leave`
Explicitly leave a room (triggers disconnect countdown for opponent).
- **emits** `{ roomCode: string }`

---

## Server → Client Events

### `room:joined`
Sent to the player after successfully creating or joining a room.
```
{ roomCode: string, playerId: string, playerCount: number }
```

### `room:player_joined`
Broadcast when a new player joins the room (sent to existing players).
```
{ playerCount: number }
```

### `room:player_left`
Broadcast when a player leaves or disconnects.
```
{ playerCount: number }
```

### `game:started`
Both players receive this when the game begins.
```
{
  firstTurnPlayerId: string,
  yourGrid: Cell[][],
  opponentGrid: Cell[][]
}
```
Note: `opponentGrid` hides ship positions — only `Empty`/`Hit`/`Miss` statuses.

### `turn:change`
Notifies both players whose turn it is.
```
{ currentPlayerId: string }
```

### `attack:result`
Broadcasts the result of an attack to both players.
```
{ attackerId: string, row: number, col: number, result: AttackResult }
```

### `game:over`
Sent when a player wins (all ships sunk or disconnect timeout).
```
{ winnerId: string, loserId: string, stats: { totalMoves: number, accuracy: number } }
```

### `player:disconnected`
Sent to the remaining player when the opponent disconnects.
```
{ countdown: number }  // seconds remaining, counts down from 60
```

### `player:reconnected`
Sent to the remaining player when the opponent reconnects within the timeout.
```
{}
```

### `error`
Generic error event.
```
{ message: string }
```
