# Money Guesser - Testing Guide

## Prerequisites

✅ Backend running on port 3001
✅ Frontend running on port 5173

## Quick Test Scenario

### Step 1: Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 2: Open Two Browser Windows

- Window 1: Host (http://localhost:5173)
- Window 2: Player (http://localhost:5173)

### Step 3: Host Creates Room

**In Window 1:**
1. Enter name: "Game Master"
2. Click "Create Room"
3. Set round duration: 30 seconds
4. Set max players: 4
5. Click "Create Room"
6. Note the room code (e.g., "ABC123")

### Step 4: Host Adds Items

**In Window 1 (Host Lobby):**

Add 3 sample items:

**Item 1:**
- Label: `Gaming Mouse`
- Image URL: `https://images.unsplash.com/photo-1527814050087-3793815479db?w=400`
- Price: `49.99`

**Item 2:**
- Label: `Coffee Maker`
- Image URL: `https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400`
- Price: `129.99`

**Item 3:**
- Label: `Backpack`
- Image URL: `https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400`
- Price: `79.99`

### Step 5: Player Joins Room

**In Window 2:**
1. Enter name: "Player One"
2. Click "Join Room"
3. Enter the room code from Step 3
4. Click "Join Room"

You should see:
- Window 1 (Host): Player appears in lobby
- Window 2 (Player): "Waiting for host..." message

### Step 6: Start Game

**In Window 1 (Host):**
1. Click "Start Game" button
2. See 3-second countdown (3, 2, 1...)

Both windows should navigate to the game room automatically.

### Step 7: Play Round 1

**Window 2 (Player):**
1. View the Gaming Mouse image
2. Enter guess: `45.00`
3. Click "Submit Guess"
4. Wait for timer to expire

**Window 1 (Host):**
- Can see the item but cannot guess
- Shows player count

### Step 8: View Results

After 30 seconds:
- Both windows show reveal screen
- Actual price: $49.99
- Player's guess: $45.00
- Points earned: ~950 points (based on formula)
- Mini leaderboard shows Player One

Wait 5 seconds for next round...

### Step 9: Complete Game

Repeat guessing for remaining 2 rounds.

After all rounds:
- Both windows navigate to results page
- Podium shows top players
- Full leaderboard displayed
- Winner celebration if you're #1

### Step 10: Play Again

Click "Play Again" to return to landing page.

## Testing Checklist

### Landing Page
- [ ] Username input accepts text
- [ ] Create room form shows/hides
- [ ] Join room form shows/hides
- [ ] Room settings validate (10-120s, 2-12 players)
- [ ] Error messages display correctly

### Lobby
- [ ] Room code displays
- [ ] "Copy Room Link" button works
- [ ] Players list updates in real-time
- [ ] Player avatars have unique colors
- [ ] Host can add multiple items
- [ ] Items show in host view only
- [ ] "Start Game" button disabled without items
- [ ] Connection status shows green when connected

### Game Room
- [ ] Countdown animation works (3, 2, 1)
- [ ] Item image loads
- [ ] Item label displays
- [ ] Round timer counts down
- [ ] Guess input accepts numbers
- [ ] Guess submission works
- [ ] "Guess Submitted" confirmation shows
- [ ] Host sees item but cannot guess
- [ ] Reveal screen shows:
  - [ ] Correct price
  - [ ] Player's guess
  - [ ] Points earned
  - [ ] Current standings
- [ ] Auto-advance to next round
- [ ] Navigate to results after final round

### Results
- [ ] Podium displays top 3
- [ ] Full leaderboard shows all players
- [ ] Rankings are correct
- [ ] Winner message appears for #1
- [ ] "Play Again" returns to landing

### WebSocket Events
- [ ] Player joined notification
- [ ] Room state updates
- [ ] Game countdown
- [ ] Round started event
- [ ] Round countdown ticks
- [ ] Guess acknowledgment
- [ ] Round reveal
- [ ] Game finished

### Error Handling
- [ ] Invalid room code shows error
- [ ] Full room shows error
- [ ] Already started game shows error
- [ ] Invalid guess rejected
- [ ] Network errors handled gracefully

## Multi-Player Test

### Test with 3+ players:

**Window 1:** Host
**Window 2:** Player 1
**Window 3:** Player 2
**Window 4:** Player 3 (optional)

1. Host creates room
2. All players join
3. Host adds items
4. Host starts game
5. All players submit different guesses
6. Verify leaderboard shows all players
7. Check correct ranking after each round

## Edge Cases to Test

### Room Limits
- Try joining with max players already in room
- Try starting game with 0 items
- Try adding item after game started

### Connection Issues
- Close player browser mid-game
- Refresh page during round
- Try joining after game started

### Input Validation
- Enter negative price
- Enter very large price (millions)
- Leave fields empty
- Enter special characters in name
- Enter very long names (>24 chars)

## Performance Test

1. Create room with 12 players (max)
2. Add 10 items
3. Set round duration to 10 seconds (minimum)
4. All players submit guesses
5. Verify smooth operation

## API Test

Use the backend test script:

```bash
cd backend
node test-api.js
```

This will test all API endpoints automatically.

## Troubleshooting

### Frontend not loading?
- Check backend is running on port 3001
- Check `.env` file has correct URLs
- Clear browser cache

### WebSocket not connecting?
- Check console for errors
- Verify token is being sent
- Check backend logs

### Images not loading?
- Use valid HTTPS URLs
- Try Unsplash images (examples above)
- Check CORS settings

### Scores seem wrong?
- Formula: `max(0, 1000 - floor(abs(guess - actual) / 10))`
- Verify with calculator
- Check backend logs

## Sample Image URLs

Use these for quick testing:

1. `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400` (Headphones)
2. `https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400` (Sneakers)
3. `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400` (Watch)
4. `https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400` (Laptop)
5. `https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400` (Mug)

## Success Criteria

✅ Host can create room
✅ Players can join room
✅ Host can add items
✅ Game starts countdown
✅ Players can submit guesses
✅ Scores calculate correctly
✅ Leaderboard updates
✅ Game completes successfully
✅ Results display correctly
✅ No console errors
✅ Responsive on mobile

## Have Fun Testing! 🎮
