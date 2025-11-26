// Quick test script to verify the API endpoints
// Run the server first with: npm start
// Then run this script with: node test-api.js

const BASE_URL = 'http://localhost:3001/v1';

async function testAPI() {
  console.log('🧪 Testing Money Guesser API...\n');

  try {
    // Test 1: Health check
    console.log('1. Health check...');
    const healthRes = await fetch('http://localhost:3001/health');
    const health = await healthRes.json();
    console.log('✓ Server is healthy:', health.status);

    // Test 2: Create room
    console.log('\n2. Creating room...');
    const createRes = await fetch(`${BASE_URL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostName: 'Test Host',
        roundDurationSeconds: 30,
        maxPlayers: 4
      })
    });
    const room = await createRes.json();
    console.log('✓ Room created:', room.roomCode);
    console.log('  Host token:', room.hostToken);

    const { roomCode, hostToken } = room;

    // Test 3: Get room state
    console.log('\n3. Getting room state...');
    const stateRes = await fetch(`${BASE_URL}/rooms/${roomCode}`);
    const state = await stateRes.json();
    console.log('✓ Room state:', state.status);
    console.log('  Players:', state.players.length);

    // Test 4: Join as player
    console.log('\n4. Joining as player...');
    const joinRes = await fetch(`${BASE_URL}/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Test Player 1'
      })
    });
    const joinData = await joinRes.json();
    console.log('✓ Player joined:', joinData.player.displayName);
    console.log('  Player ID:', joinData.player.id);
    console.log('  Avatar color:', joinData.player.avatarColor);

    const { playerToken } = joinData;

    // Test 5: Add item (host only)
    console.log('\n5. Adding item...');
    const itemRes = await fetch(`${BASE_URL}/rooms/${roomCode}/items`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hostToken}`
      },
      body: JSON.stringify({
        label: 'Test Item',
        imageUrl: 'https://example.com/image.jpg',
        priceCents: 1999
      })
    });
    const item = await itemRes.json();
    console.log('✓ Item added:', item.label);
    console.log('  Price:', item.priceCents, 'cents');

    // Test 6: Get leaderboard
    console.log('\n6. Getting leaderboard...');
    const leaderboardRes = await fetch(`${BASE_URL}/rooms/${roomCode}/leaderboard`);
    const leaderboard = await leaderboardRes.json();
    console.log('✓ Leaderboard entries:', leaderboard.leaderboard.length);

    console.log('\n✅ All tests passed!');
    console.log('\nℹ️  To test gameplay:');
    console.log('   1. Add more items via POST /rooms/${roomCode}/items');
    console.log('   2. Start game: POST /rooms/${roomCode}/start');
    console.log('   3. Connect WebSocket: ws://localhost:3001/ws/rooms/${roomCode}?token=${playerToken}');
    console.log('   4. Submit guesses during rounds');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
