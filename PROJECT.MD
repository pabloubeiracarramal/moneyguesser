
# Money Guesser - Project Guide

## Project Overview
A multiplayer web game where players guess the prices of items shown in images. Players compete in timed rounds to get closest to the actual price and earn points.

## Core Features

### 1. User Flow
- **Entry**: User enters username on landing page
- **Room Options**: 
    - Create new room
    - Join existing room with code
- **Room Sharing**: Copy link button to share room with other players

### 2. Roles

#### Room Creator (Host)
- Cannot play (knows all prices)
- Accesses game creation screen
- Provides item picture URLs (pre-hosted on image hosting service)
- Sets correct price for each item
- Starts the game

#### Players
- Join via room code or link
- Guess prices during rounds
- Compete for highest score

### 3. Game Flow

#### Round Structure
- Game consists of **N rounds**
- Each round shows one item image
- Players have **X seconds** to submit price guess
- Scoring based on proximity to actual price
- Leaderboard displays after each round with:
    - Player scores
    - Correct price reveal

#### End Game
- Winners screen showing **Top 3 players**
- Visual celebration/podium display

## Technical Considerations

### Key Components
- Real-time multiplayer synchronization
- Image hosting (external service - users provide URLs)
- Timer system
- Scoring algorithm (hybrid system):
    - Percentage-based accuracy: 0-1000 base points
    - Speed multiplier: 1.0x to 1.5x (faster = higher multiplier)
    - Order bonus: 100/50/25 points for 1st/2nd/3rd submissions
    - Max possible: ~1,600 points per round
- Room management (codes/links)
- Leaderboard system

### Suggested Tech Stack
- **Frontend**: React
- **Backend**: Node.js with WebSocket (Socket.io)
- **Image Hosting**: External (users provide URLs from Imgur, Cloudinary, etc.)

## Development Phases

1. **MVP**: Single room, basic scoring, timer
2. **Enhancement**: Multiple rooms, better UI, animations
3. **Polish**: Winners screen, room management, mobile responsive

## Architecture Notes

### In-Memory Storage
- All game state stored in server memory
- Room data, player info, and scores kept in JavaScript objects/Maps
- No database required - simpler deployment
- **Trade-off**: Data lost on server restart (suitable for casual gaming sessions)


## Additional Documentation
- [API Specification](API_SPEC.md)
