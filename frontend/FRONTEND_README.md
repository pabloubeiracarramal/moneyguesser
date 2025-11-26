# Money Guesser Frontend

React frontend for the Money Guesser multiplayer game.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

## Environment Variables

The `.env` file is already configured for local development:
- Backend API: `http://localhost:3001/v1`
- WebSocket: `ws://localhost:3001`

For production, create a `.env.production` file with your deployed backend URLs.

## Features

### Landing Page
- Username input
- Create room with custom settings
- Join room with code

### Lobby
- **Host**: Add items, see players, start game
- **Player**: Wait for host, see other players

### Game Room
- Countdown animation
- Item display with image
- Price guessing interface
- Round timer
- Results reveal with scoring
- Mini leaderboard between rounds

### Results
- Top 3 podium display
- Full leaderboard
- Winner celebration
- Play again option

## Tech Stack

- React with Vite
- React Router for navigation
- WebSocket for real-time updates
- Plain CSS with animations
- No TypeScript (JavaScript only)

## Development Notes

- Ensure backend is running on port 3001
- WebSocket connection authenticated via tokens
- Prices entered in dollars, sent as cents
- Room codes are 6-character alphanumeric
