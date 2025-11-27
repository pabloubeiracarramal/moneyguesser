const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/v1';

/**
 * Create a new game room
 */
export async function createRoom(hostName, roundDurationSeconds = 30) {
  const response = await fetch(`${API_BASE_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      hostName,
      roundDurationSeconds,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create room');
  }

  return response.json();
}

/**
 * Get room state
 */
export async function getRoomState(roomCode) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomCode}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get room state');
  }

  return response.json();
}

/**
 * Leave a room
 */
export async function leaveRoom(roomCode, token, isHost = false) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomCode}/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      isHost ? { hostToken: token } : { playerToken: token }
    ),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to leave room');
  }

  return response.json();
}

/**
 * Join a room as a player
 */
export async function joinRoom(roomCode, displayName) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomCode}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      displayName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to join room');
  }

  return response.json();
}

/**
 * Add an item to the room (host only)
 */
export async function addItem(roomCode, hostToken, label, imageUrl, priceCents) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomCode}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hostToken}`,
    },
    body: JSON.stringify({
      label,
      imageUrl,
      priceCents,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add item');
  }

  return response.json();
}

/**
 * Update room settings (host only)
 */
export async function updateRoomSettings(roomCode, hostToken, roundDurationSeconds) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomCode}/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hostToken}`,
    },
    body: JSON.stringify({
      roundDurationSeconds,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update settings');
  }

  return response.json();
}

/**
 * Start the game (host only)
 */
export async function startGame(roomCode, hostToken) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomCode}/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hostToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start game');
  }

  return response.json();
}

/**
 * Submit a guess for the current round
 */
export async function submitGuess(roomCode, roundId, playerToken, priceCents) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomCode}/rounds/${roundId}/guess`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playerToken,
      priceCents,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit guess');
  }

  return response.json();
}

/**
 * Get the leaderboard
 */
export async function getLeaderboard(roomCode) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomCode}/leaderboard`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get leaderboard');
  }

  return response.json();
}
