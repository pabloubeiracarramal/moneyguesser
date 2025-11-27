import express from 'express';
import { roomManager } from '../managers/RoomManager.js';

const router = express.Router();

/**
 * POST /rooms
 * Create a new room
 */
router.post('/', (req, res) => {
  try {
    const { hostName, roundDurationSeconds } = req.body;

    // Validation
    if (!hostName || typeof hostName !== 'string' || hostName.length > 24) {
      return res.status(400).json({ error: 'Invalid hostName' });
    }

    if (!roundDurationSeconds || roundDurationSeconds < 10 || roundDurationSeconds > 120) {
      return res.status(400).json({ error: 'roundDurationSeconds must be between 10 and 120' });
    }

    const room = roomManager.createRoom(hostName, roundDurationSeconds);

    res.status(201).json({
      roomCode: room.roomCode,
      hostToken: room.hostToken,
      shareUrl: `${req.protocol}://${req.get('host')}/room/${room.roomCode}`
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

/**
 * GET /rooms/:roomCode
 * Get room state
 */
router.get('/:roomCode', (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = roomManager.getRoom(roomCode);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Hide prices unless in reveal or finished status
    const revealPrice = room.status === 'reveal' || room.status === 'finished';
    res.json(room.toJSON(revealPrice));
  } catch (error) {
    console.error('Error getting room:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

/**
 * POST /rooms/:roomCode/join
 * Join a room as a player
 */
router.post('/:roomCode/join', (req, res) => {
  try {
    const { roomCode } = req.params;
    const { displayName } = req.body;

    // Validation
    if (!displayName || typeof displayName !== 'string' || displayName.length > 24) {
      return res.status(400).json({ error: 'Invalid displayName' });
    }

    const room = roomManager.getRoom(roomCode);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    try {
      const { player, playerToken } = room.addPlayer(displayName);

      // Broadcast player joined event
      roomManager.broadcast(roomCode, 'player.joined', player.toJSON());
      roomManager.broadcast(roomCode, 'room.updated', room.toJSON());

      res.json({
        playerToken,
        player: player.toJSON()
      });
    } catch (err) {
      if (err.message === 'Room is full') {
        return res.status(409).json({ error: 'Room is full' });
      }
      if (err.message === 'Cannot join: game already started') {
        return res.status(409).json({ error: 'Game already started' });
      }
      throw err;
    }
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

/**
 * PATCH /rooms/:roomCode/settings
 * Update room settings (host only, lobby only)
 */
router.patch('/:roomCode/settings', (req, res) => {
  try {
    const { roomCode } = req.params;
    const { roundDurationSeconds } = req.body;
    const hostToken = req.headers.authorization?.replace('Bearer ', '');

    const room = roomManager.getRoom(roomCode);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.verifyHostToken(hostToken)) {
      return res.status(403).json({ error: 'Host authentication required' });
    }

    if (roundDurationSeconds !== undefined) {
      try {
        room.updateRoundDuration(roundDurationSeconds);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    roomManager.broadcast(roomCode, 'room.updated', room.toJSON());
    res.json(room.toJSON());
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * POST /rooms/:roomCode/items
 * Add an item to the room (host only)
 */
router.post('/:roomCode/items', (req, res) => {
  try {
    const { roomCode } = req.params;
    const { label, imageUrl, priceCents } = req.body;
    const hostToken = req.headers.authorization?.replace('Bearer ', '');

    // Validation
    if (!label || !imageUrl || priceCents === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (typeof priceCents !== 'number' || priceCents < 0) {
      return res.status(400).json({ error: 'Invalid priceCents' });
    }

    const room = roomManager.getRoom(roomCode);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.verifyHostToken(hostToken)) {
      return res.status(403).json({ error: 'Host authentication required' });
    }

    try {
      const item = room.addItem(label, imageUrl, priceCents);

      // Notify host only (don't reveal items to players)
      roomManager.sendToHost(roomCode, 'item.added', item.toJSONHidden());
      roomManager.broadcast(roomCode, 'room.updated', room.toJSON());

      res.status(201).json(item.toJSON());
    } catch (err) {
      if (err.message === 'Cannot add items: game already started') {
        return res.status(409).json({ error: 'Cannot add items after game starts' });
      }
      throw err;
    }
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

/**
 * POST /rooms/:roomCode/start
 * Start the game (host only)
 */
router.post('/:roomCode/start', (req, res) => {
  try {
    const { roomCode } = req.params;
    const hostToken = req.headers.authorization?.replace('Bearer ', '');

    const room = roomManager.getRoom(roomCode);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.verifyHostToken(hostToken)) {
      return res.status(403).json({ error: 'Host authentication required' });
    }

    if (room.status !== 'lobby') {
      return res.status(409).json({ error: 'Game already started' });
    }

    try {
      roomManager.startGame(roomCode);
      res.status(202).json({ message: 'Game starting' });
    } catch (err) {
      return res.status(409).json({ error: err.message });
    }
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

/**
 * POST /rooms/:roomCode/rounds/:roundId/guess
 * Submit a guess for the current round
 */
router.post('/:roomCode/rounds/:roundId/guess', (req, res) => {
  try {
    const { roomCode, roundId } = req.params;
    const { playerToken, priceCents } = req.body;

    // Validation
    if (!playerToken) {
      return res.status(400).json({ error: 'playerToken required' });
    }

    if (typeof priceCents !== 'number' || priceCents < 0) {
      return res.status(400).json({ error: 'Invalid priceCents' });
    }

    const room = roomManager.getRoom(roomCode);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const player = room.getPlayerByToken(playerToken);
    if (!player) {
      return res.status(403).json({ error: 'Invalid player token' });
    }

    // Verify round ID matches current round
    if (parseInt(roundId) !== room.roundNumber) {
      return res.status(422).json({ error: 'Invalid round number' });
    }

    try {
      room.submitGuess(player.id, priceCents);

      // Acknowledge guess
      roomManager.sendToPlayer(roomCode, player.id, 'guess.ack', {
        playerId: player.id,
        roundNumber: room.roundNumber
      });

      // Check if all players have guessed - if so, end round immediately
      if (room.allPlayersGuessed()) {
        roomManager.endRoundEarly(roomCode);
      }

      res.json({ message: 'Guess recorded' });
    } catch (err) {
      return res.status(422).json({ error: err.message });
    }
  } catch (error) {
    console.error('Error submitting guess:', error);
    res.status(500).json({ error: 'Failed to submit guess' });
  }
});

/**
 * GET /rooms/:roomCode/leaderboard
 * Get current leaderboard
 */
router.get('/:roomCode/leaderboard', (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = roomManager.getRoom(roomCode);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const leaderboard = room.getLeaderboard();

    res.json({
      roomCode,
      leaderboard
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

/**
 * POST /rooms/:roomCode/leave
 * Leave a room (player or host)
 */
router.post('/:roomCode/leave', (req, res) => {
  try {
    const { roomCode } = req.params;
    const { playerToken, hostToken } = req.body;

    const room = roomManager.getRoom(roomCode);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // If host is leaving, delete the room
    if (hostToken && room.verifyHostToken(hostToken)) {
      roomManager.deleteRoom(roomCode);
      return res.json({ message: 'Room closed' });
    }

    // If player is leaving, remove them from the room
    if (playerToken) {
      const player = room.getPlayerByToken(playerToken);
      if (player) {
        room.removePlayer(player.id);
        roomManager.broadcast(roomCode, 'room.updated', room.toJSON());
        return res.json({ message: 'Left room' });
      }
    }

    res.status(400).json({ error: 'Invalid token' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

export default router;
