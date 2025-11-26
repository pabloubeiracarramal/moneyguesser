# API Testing Examples

Use these examples with curl, Postman, or any REST client.

## 1. Create Room

```bash
curl -X POST http://localhost:3001/v1/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "hostName": "Game Master",
    "roundDurationSeconds": 30,
    "maxPlayers": 6
  }'
```

Response:
```json
{
  "roomCode": "ABC123",
  "hostToken": "xyz789...",
  "shareUrl": "http://localhost:3001/room/ABC123"
}
```

## 2. Get Room State

```bash
curl http://localhost:3001/v1/rooms/ABC123
```

## 3. Join Room as Player

```bash
curl -X POST http://localhost:3001/v1/rooms/ABC123/join \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Player One"
  }'
```

Response:
```json
{
  "playerToken": "abc456...",
  "player": {
    "id": "uuid-here",
    "displayName": "Player One",
    "avatarColor": "#FF6B6B",
    "score": 0
  }
}
```

## 4. Add Item (Host Only)

```bash
curl -X POST http://localhost:3001/v1/rooms/ABC123/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_HOST_TOKEN" \
  -d '{
    "label": "Luxury Watch",
    "imageUrl": "https://example.com/watch.jpg",
    "priceCents": 599900
  }'
```

## 5. Add Multiple Items

```bash
# Item 1
curl -X POST http://localhost:3001/v1/rooms/ABC123/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_HOST_TOKEN" \
  -d '{
    "label": "Coffee Maker",
    "imageUrl": "https://example.com/coffee.jpg",
    "priceCents": 12999
  }'

# Item 2
curl -X POST http://localhost:3001/v1/rooms/ABC123/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_HOST_TOKEN" \
  -d '{
    "label": "Laptop",
    "imageUrl": "https://example.com/laptop.jpg",
    "priceCents": 149999
  }'

# Item 3
curl -X POST http://localhost:3001/v1/rooms/ABC123/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_HOST_TOKEN" \
  -d '{
    "label": "Headphones",
    "imageUrl": "https://example.com/headphones.jpg",
    "priceCents": 29999
  }'
```

## 6. Start Game (Host Only)

```bash
curl -X POST http://localhost:3001/v1/rooms/ABC123/start \
  -H "Authorization: Bearer YOUR_HOST_TOKEN"
```

## 7. Submit Guess

```bash
curl -X POST http://localhost:3001/v1/rooms/ABC123/rounds/1/guess \
  -H "Content-Type: application/json" \
  -d '{
    "playerToken": "YOUR_PLAYER_TOKEN",
    "priceCents": 149000
  }'
```

## 8. Get Leaderboard

```bash
curl http://localhost:3001/v1/rooms/ABC123/leaderboard
```

## WebSocket Connection (JavaScript)

```javascript
const roomCode = 'ABC123';
const token = 'YOUR_PLAYER_TOKEN'; // or hostToken

const ws = new WebSocket(`ws://localhost:3001/ws/rooms/${roomCode}?token=${token}`);

ws.onopen = () => {
  console.log('Connected to game room');
};

ws.onmessage = (event) => {
  const { event: eventType, data } = JSON.parse(event.data);
  console.log('Event:', eventType, data);
  
  switch(eventType) {
    case 'room.updated':
      // Update UI with room state
      break;
    case 'round.started':
      // Show item and start timer
      break;
    case 'round.countdown':
      // Update timer display
      break;
    case 'round.reveal':
      // Show results and leaderboard
      break;
    case 'game.finished':
      // Show final standings
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from game room');
};

// Send ping to keep connection alive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action: 'ping' }));
  }
}, 30000);
```

## Complete Game Flow Example

```bash
# 1. Create room
RESPONSE=$(curl -s -X POST http://localhost:3001/v1/rooms \
  -H "Content-Type: application/json" \
  -d '{"hostName":"Host","roundDurationSeconds":30,"maxPlayers":4}')

ROOM_CODE=$(echo $RESPONSE | jq -r '.roomCode')
HOST_TOKEN=$(echo $RESPONSE | jq -r '.hostToken')

echo "Room Code: $ROOM_CODE"
echo "Host Token: $HOST_TOKEN"

# 2. Join as player
PLAYER_RESPONSE=$(curl -s -X POST http://localhost:3001/v1/rooms/$ROOM_CODE/join \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Player1"}')

PLAYER_TOKEN=$(echo $PLAYER_RESPONSE | jq -r '.playerToken')
echo "Player Token: $PLAYER_TOKEN"

# 3. Add items
curl -X POST http://localhost:3001/v1/rooms/$ROOM_CODE/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HOST_TOKEN" \
  -d '{"label":"Item1","imageUrl":"https://example.com/1.jpg","priceCents":1999}'

curl -X POST http://localhost:3001/v1/rooms/$ROOM_CODE/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $HOST_TOKEN" \
  -d '{"label":"Item2","imageUrl":"https://example.com/2.jpg","priceCents":4999}'

# 4. Start game
curl -X POST http://localhost:3001/v1/rooms/$ROOM_CODE/start \
  -H "Authorization: Bearer $HOST_TOKEN"

echo "Game started! Connect WebSocket at: ws://localhost:3001/ws/rooms/$ROOM_CODE?token=$PLAYER_TOKEN"
```

## Testing with HTTPie (alternative)

If you have HTTPie installed:

```bash
# Create room
http POST localhost:3001/v1/rooms hostName="Host" roundDurationSeconds:=30 maxPlayers:=4

# Join room
http POST localhost:3001/v1/rooms/ABC123/join displayName="Player"

# Add item
http POST localhost:3001/v1/rooms/ABC123/items \
  Authorization:"Bearer TOKEN" \
  label="Item" imageUrl="https://example.com/img.jpg" priceCents:=1999

# Get leaderboard
http GET localhost:3001/v1/rooms/ABC123/leaderboard
```
