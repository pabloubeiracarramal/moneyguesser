import { Room, RoomStatus } from '../models/Room.js';
import { generateRoomCode } from '../utils/generateCode.js';

/**
 * Manages all game rooms in memory
 */
export class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> Room
    this.wsConnections = new Map(); // roomCode -> Set of WebSocket connections
  }

  /**
   * Create a new room
   */
  createRoom(hostName, roundDurationSeconds) {
    let roomCode;
    // Ensure unique room code
    do {
      roomCode = generateRoomCode();
    } while (this.rooms.has(roomCode));

    const room = new Room(roomCode, hostName, roundDurationSeconds);
    this.rooms.set(roomCode, room);
    this.wsConnections.set(roomCode, new Set());

    return room;
  }

  /**
   * Get a room by code
   */
  getRoom(roomCode) {
    return this.rooms.get(roomCode) || null;
  }

  /**
   * Delete a room
   */
  deleteRoom(roomCode) {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.cleanup();
      
      // Close all WebSocket connections
      const connections = this.wsConnections.get(roomCode);
      if (connections) {
        connections.forEach(ws => {
          if (ws.readyState === 1) { // OPEN
            ws.close();
          }
        });
      }
      
      this.rooms.delete(roomCode);
      this.wsConnections.delete(roomCode);
    }
  }

  /**
   * Add a WebSocket connection to a room
   */
  addConnection(roomCode, ws, playerId = null, isHost = false) {
    if (!this.wsConnections.has(roomCode)) {
      this.wsConnections.set(roomCode, new Set());
    }
    
    ws.roomCode = roomCode;
    ws.playerId = playerId;
    ws.isHost = isHost;
    
    this.wsConnections.get(roomCode).add(ws);
  }

  /**
   * Remove a WebSocket connection
   */
  removeConnection(ws) {
    if (ws.roomCode && this.wsConnections.has(ws.roomCode)) {
      this.wsConnections.get(ws.roomCode).delete(ws);
    }
  }

  /**
   * Broadcast message to all connections in a room
   */
  broadcast(roomCode, event, data) {
    const connections = this.wsConnections.get(roomCode);
    if (!connections) return;

    const message = JSON.stringify({ event, data });
    
    connections.forEach(ws => {
      if (ws.readyState === 1) { // OPEN
        ws.send(message);
      }
    });
  }

  /**
   * Send message to a specific player
   */
  sendToPlayer(roomCode, playerId, event, data) {
    const connections = this.wsConnections.get(roomCode);
    if (!connections) return;

    const message = JSON.stringify({ event, data });
    
    connections.forEach(ws => {
      if (ws.playerId === playerId && ws.readyState === 1) {
        ws.send(message);
      }
    });
  }

  /**
   * Send message to host only
   */
  sendToHost(roomCode, event, data) {
    const connections = this.wsConnections.get(roomCode);
    if (!connections) return;

    const message = JSON.stringify({ event, data });
    
    connections.forEach(ws => {
      if (ws.isHost && ws.readyState === 1) {
        ws.send(message);
      }
    });
  }

  /**
   * Start game countdown and trigger rounds
   */
  startGame(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return;

    if (room.items.length === 0) {
      throw new Error('No items in room');
    }

    if (room.players.size === 0) {
      throw new Error('No players in room');
    }

    // Start countdown
    room.status = RoomStatus.COUNTDOWN;
    this.broadcast(roomCode, 'room.updated', room.toJSON());

    let countdown = 3;
    const countdownInterval = setInterval(() => {
      this.broadcast(roomCode, 'game.countdown', { seconds: countdown });
      countdown--;

      if (countdown < 0) {
        clearInterval(countdownInterval);
        this.startRound(roomCode);
      }
    }, 1000);
  }

  /**
   * Start a new round
   */
  startRound(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return;

    room.currentItemIndex++;
    room.roundNumber = room.currentItemIndex + 1;
    room.roundGuesses.clear();
    room.roundStartTime = Date.now();

    if (room.currentItemIndex >= room.items.length) {
      // Game finished
      this.endGame(roomCode);
      return;
    }

    room.status = RoomStatus.ACTIVE;
    const currentItem = room.getCurrentItem(false);

    this.broadcast(roomCode, 'round.started', {
      roundNumber: room.roundNumber,
      itemId: currentItem.id,
      itemLabel: currentItem.label,
      imageUrl: currentItem.imageUrl,
      durationSeconds: room.roundDurationSeconds,
      startTime: room.roundStartTime
    });

    this.broadcast(roomCode, 'room.updated', room.toJSON());

    // Clear any existing countdown interval
    if (room.countdownInterval) {
      clearInterval(room.countdownInterval);
      room.countdownInterval = null;
    }

    // Start round timer with countdown events
    let remainingSeconds = room.roundDurationSeconds;
    
    room.countdownInterval = setInterval(() => {
      remainingSeconds--;
      this.broadcast(roomCode, 'round.countdown', {
        roundNumber: room.roundNumber,
        remainingSeconds
      });

      if (remainingSeconds <= 0) {
        clearInterval(room.countdownInterval);
        room.countdownInterval = null;
      }
    }, 1000);

    // End round after duration
    room.roundTimer = setTimeout(() => {
      this.endRound(roomCode);
    }, room.roundDurationSeconds * 1000);
  }

  /**
   * End current round early (when all players have guessed)
   */
  endRoundEarly(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return;

    // Cancel the existing round timer if it's running
    if (room.roundTimer) {
      clearTimeout(room.roundTimer);
      room.roundTimer = null;
    }

    // Immediately end the round
    this.endRound(roomCode);
  }

  /**
   * End current round and show results
   */
  endRound(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return;

    // Only proceed if round is still active
    if (room.status !== RoomStatus.ACTIVE) return;

    // Clear any running timers
    if (room.countdownInterval) {
      clearInterval(room.countdownInterval);
      room.countdownInterval = null;
    }
    if (room.roundTimer) {
      clearTimeout(room.roundTimer);
      room.roundTimer = null;
    }

    room.status = RoomStatus.REVEAL;

    // Calculate scores
    const roundResults = room.calculateRoundScores();
    const leaderboard = room.getLeaderboard();
    const currentItem = room.getCurrentItem(true); // Reveal price

    this.broadcast(roomCode, 'round.reveal', {
      roundNumber: room.roundNumber,
      correctPriceCents: currentItem.priceCents,
      roundResults,
      leaderboard
    });

    this.broadcast(roomCode, 'room.updated', room.toJSON(true));

    // Wait 20 seconds before next round (reveal animation + leaderboard display)
    setTimeout(() => {
      this.startRound(roomCode);
    }, 20000);
  }

  /**
   * End the game
   */
  endGame(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return;

    room.status = RoomStatus.FINISHED;
    const finalLeaderboard = room.getLeaderboard();
    const winner = finalLeaderboard[0] || null;

    this.broadcast(roomCode, 'game.finished', {
      finalLeaderboard,
      winner
    });

    this.broadcast(roomCode, 'room.updated', room.toJSON());

    // Clean up room after 5 minutes
    setTimeout(() => {
      this.deleteRoom(roomCode);
    }, 5 * 60 * 1000);
  }
}

// Singleton instance
export const roomManager = new RoomManager();
