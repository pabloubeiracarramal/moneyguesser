# Money Guesser Backend

Backend server for the Money Guesser multiplayer game.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will start on port 3001 by default.

## API Endpoints

### REST API (v1)

All endpoints are prefixed with `/v1`

#### Rooms

- `POST /rooms` - Create a new room
  - Body: `{ hostName, roundDurationSeconds, maxPlayers }`
  - Returns: `{ roomCode, hostToken, shareUrl }`

- `GET /rooms/:roomCode` - Get room state
  - Returns: Room state with players, current item (price hidden during active rounds)

- `POST /rooms/:roomCode/join` - Join room as player
  - Body: `{ displayName }`
  - Returns: `{ playerToken, player }`

- `POST /rooms/:roomCode/items` - Add item (host only)
  - Headers: `Authorization: Bearer {hostToken}`
  - Body: `{ label, imageUrl, priceCents }`
  - Returns: Item object

- `POST /rooms/:roomCode/start` - Start game (host only)
  - Headers: `Authorization: Bearer {hostToken}`
  - Returns: `{ message: 'Game starting' }`

#### Gameplay

- `POST /rooms/:roomCode/rounds/:roundId/guess` - Submit guess
  - Body: `{ playerToken, priceCents }`
  - Returns: `{ message: 'Guess recorded' }`

- `GET /rooms/:roomCode/leaderboard` - Get leaderboard
  - Returns: `{ roomCode, leaderboard }`

### WebSocket

Connect to: `ws://localhost:3001/ws/rooms/{roomCode}?token={playerToken|hostToken}`

#### Events Sent to Client

- `room.updated` - Room state changed
- `player.joined` - New player joined
- `player.left` - Player disconnected
- `item.added` - Item added (host only)
- `game.countdown` - Game starting countdown
- `round.started` - New round started
- `round.countdown` - Round timer countdown
- `guess.ack` - Guess acknowledged
- `round.reveal` - Round ended, showing results
- `game.finished` - Game completed with final results
- `error` - Error occurred

## Architecture

### In-Memory Storage

All data is stored in memory using JavaScript Maps:
- Rooms: Map<roomCode, Room>
- Players: Stored within Room objects
- WebSocket connections: Map<roomCode, Set<WebSocket>>

### Key Components

- **RoomManager**: Manages all rooms, WebSocket connections, and game flow
- **Room**: Room state, players, items, and game logic
- **Player**: Player data (id, displayName, avatarColor, score)
- **Item**: Item data (id, label, imageUrl, priceCents)

### Scoring Formula

```javascript
points = max(0, 1000 - floor(abs(guessCents - actualCents) / 10))
```

### Game Flow

1. Host creates room → receives roomCode and hostToken
2. Players join with roomCode → receive playerToken
3. Host adds items (imageUrl, priceCents, label)
4. Host starts game → 3-second countdown
5. For each item:
   - Round starts (status: active)
   - Players submit guesses
   - Timer counts down
   - Round ends (status: reveal)
   - Scores calculated and shown
   - 5-second pause
   - Next round or game end
6. Game finishes → final leaderboard shown

## Environment Variables

- `PORT` - Server port (default: 3001)

## Development Notes

- No database required - all state in memory
- Rooms auto-delete 5 minutes after game completion
- WebSocket connections authenticated via token query parameter
- Host cannot play (knows all prices)
- Maximum 12 players per room
- Round duration: 10-120 seconds
