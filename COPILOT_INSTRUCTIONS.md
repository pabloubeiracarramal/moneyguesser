# Money Guesser - Copilot Implementation Guide

This guide outlines the steps and architectural details for building the Money Guesser application, based on `PROJECT.MD` and `API_SPEC.md`.

## 1. Project Structure
The project will be set up as a monorepo with two main directories:
- `/backend`: Node.js server (Express + WebSocket)
- `/frontend`: React application (Vite)

## 2. Backend Implementation (`/backend`)

### Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js (for REST API)
- **WebSockets**: `ws` library (preferred for strict adherence to `wss://.../ws/rooms/{roomCode}` URL pattern in API Spec) or `socket.io` (if flexibility is allowed). *Note: API Spec defines specific WS paths.*
- **Storage**: In-memory (JavaScript Objects/Maps) as per `PROJECT.MD`.

### Data Models (In-Memory)
Create a `Store` or `GameManager` class to manage state.
- **Rooms**: `Map<string, Room>`
  - Key: `roomCode` (6-char alphanumeric, server-generated)
  - Value: Object containing status, players, items, current roundNumber, timer info, config.
- **Players**: Stored within Rooms. Server assigns `id` and `avatarColor` on join.
- **Items**: Stored within Rooms (host provides URL, price, label). Server assigns `id`.
- **Tokens**: Generate unique tokens for hosts and players for WebSocket auth.

### API Implementation (REST)
Implement the following routes defined in `API_SPEC.md`:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/rooms` | Create room. Generate `roomCode` and `hostToken`. Initialize room state. |
| GET | `/rooms/{roomCode}` | Get room state (lobby/game status). Handle 404s. |
| POST | `/rooms/{roomCode}/join` | Add player. Generate `playerToken`. Return player details. |
| POST | `/rooms/{roomCode}/items` | (Host only) Add item to game. Validate `hostToken`. |
| POST | `/rooms/{roomCode}/start` | (Host only) Change status to `countdown` -> `active`. Start timer. |
| POST | `/rooms/{roomCode}/rounds/{roundNumber}/guess` | Record player guess. Validate round is active. Use roundNumber from RoomState. |
| GET | `/rooms/{roomCode}/leaderboard` | Calculate and return scores. |

### WebSocket Implementation
- **Endpoint**: `/ws/rooms/{roomCode}`
- **Authentication**: Query param `?token=<token>` (validate against host or player token).
- **Events to Emit**:
  - `room.updated`: On any state change (player join, status change).
  - `round.started`, `round.countdown`, `round.reveal`: Game flow events.
  - `game.finished`: End of game.
- **Handling Connections**: Map WebSocket connections to specific Rooms and Players to broadcast messages efficiently.

## 3. Frontend Implementation (`/frontend`)

### Tech Stack
- **Framework**: React (via Vite)
- **Styling**: Plain CSS
- **Routing**: React Router (`react-router-dom`).

### Application Flow & Routes

1.  **Landing Page (`/`)**
    -   Input for Username.
    -   Button: "Create Room" (POST `/rooms`).
    -   Button: "Join Room" (Input for Room Code -> POST `/rooms/:code/join`).

2.  **Lobby (`/room/:roomCode/lobby`)**
    -   Display Room Code and Share URL.
    -   List joined players (listen for `room.updated` or `player.joined`).
    -   **Host View**: "Add Item" form (Image URL - pre-hosted, Price in cents, Label). "Start Game" button.
    -   **Player View**: "Waiting for host..." message. Show player count vs max.

3.  **Game Room (`/room/:roomCode/play`)**
    -   **Countdown Phase**: Display timer.
    -   **Active Round**:
        -   Display Item Image.
        -   Input field for Price Guess.
        -   Submit button.
        -   Timer countdown.
    -   **Reveal Phase**:
        -   Show actual price.
        -   Show round results/points earned.

4.  **Leaderboard (`/room/:roomCode/results`)**
    -   Display final scores and rankings.
    -   "Play Again" option (if supported).

### Key Components
- `GameProvider`: Context to manage global game state (current room, player token, socket connection).
- `WebSocketClient`: A service/hook to handle WS connection, reconnection, and event dispatching.
- `ItemUploader`: (Host) Component to input item details (URL, price in cents, label).
- `Timer`: Visual countdown component driven by `round.countdown` WebSocket events.
- `Scoring`: Implement formula: `points = max(0, 1000 - Math.floor(Math.abs(guessCents - actualCents) / 10))`

## 4. Development Workflow Steps

1.  **Scaffold Backend**:
    -   `npm init` in `/backend`.
    -   Install `express`, `ws`, `cors`, `body-parser`.
    -   Setup `server.js` with basic HTTP and WS server.

2.  **Implement Core Logic (Backend)**:
    -   Create `RoomManager.js`.
    -   Implement `createRoom`, `joinRoom`, `addItem`.
    -   Implement Game Loop (timers for rounds).

3.  **Scaffold Frontend**:
    -   `npm create vite@latest frontend -- --template react`.
    -   Install `react-router-dom`, `axios` (or use fetch).

4.  **Connect Frontend to Backend**:
    -   Create API service functions.
    -   Create WebSocket hook.
    -   Build UI for Landing -> Lobby -> Game flow.

5.  **Testing**:
    -   Test Host flow (Create -> Add Items -> Start).
    -   Test Player flow (Join -> Guess).
    -   Verify Scoring logic.
