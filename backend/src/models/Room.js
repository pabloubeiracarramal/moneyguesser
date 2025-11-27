import { generateToken } from '../utils/generateCode.js';
import { Player } from './Player.js';
import { Item } from './Item.js';

/**
 * Room statuses
 */
export const RoomStatus = {
  LOBBY: 'lobby',
  COUNTDOWN: 'countdown',
  ACTIVE: 'active',
  REVEAL: 'reveal',
  FINISHED: 'finished'
};

/**
 * Represents a game room
 */
export class Room {
  constructor(roomCode, hostName, roundDurationSeconds) {
    this.roomCode = roomCode;
    this.hostName = hostName;
    this.hostToken = generateToken();
    this.roundDurationSeconds = roundDurationSeconds;
    
    this.status = RoomStatus.LOBBY;
    this.players = new Map(); // playerId -> Player
    this.playerTokens = new Map(); // playerToken -> playerId
    this.items = []; // Array of Item objects
    this.roundNumber = 0;
    this.totalRounds = 0;
    
    // Round state
    this.currentItemIndex = -1;
    this.roundGuesses = new Map(); // playerId -> { guessCents, timestamp }
    this.roundStartTime = null;
    this.roundTimer = null;
    this.countdownTimer = null;
    this.countdownInterval = null;
  }

  /**
   * Add a player to the room
   */
  addPlayer(displayName) {
    if (this.status !== RoomStatus.LOBBY) {
      throw new Error('Cannot join: game already started');
    }

    const player = new Player(displayName);
    const playerToken = generateToken();
    
    this.players.set(player.id, player);
    this.playerTokens.set(playerToken, player.id);
    
    return { player, playerToken };
  }

  /**
   * Remove a player from the room
   */
  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;

    // Find and remove player token
    for (const [token, pId] of this.playerTokens.entries()) {
      if (pId === playerId) {
        this.playerTokens.delete(token);
        break;
      }
    }

    // Remove player
    this.players.delete(playerId);
    
    // Remove any pending guesses from this player
    this.roundGuesses.delete(playerId);
  }

  /**
   * Add an item to the room
   */
  addItem(label, imageUrl, priceCents) {
    if (this.status !== RoomStatus.LOBBY) {
      throw new Error('Cannot add items: game already started');
    }

    const item = new Item(label, imageUrl, priceCents);
    this.items.push(item);
    this.totalRounds = this.items.length;
    
    return item;
  }

  /**
   * Get player by token
   */
  getPlayerByToken(token) {
    const playerId = this.playerTokens.get(token);
    return playerId ? this.players.get(playerId) : null;
  }

  /**
   * Verify host token
   */
  verifyHostToken(token) {
    return token === this.hostToken;
  }

  /**
   * Get current item (with or without price)
   */
  getCurrentItem(revealPrice = false) {
    if (this.currentItemIndex < 0 || this.currentItemIndex >= this.items.length) {
      return null;
    }
    
    const item = this.items[this.currentItemIndex];
    return revealPrice ? item.toJSON() : item.toJSONHidden();
  }

  /**
   * Submit a guess for the current round
   */
  submitGuess(playerId, priceCents) {
    if (this.status !== RoomStatus.ACTIVE) {
      throw new Error('Round is not active');
    }
    
    if (!this.players.has(playerId)) {
      throw new Error('Player not found');
    }

    this.roundGuesses.set(playerId, {
      guessCents: priceCents,
      timestamp: Date.now()
    });
  }

  /**
   * Check if all players have submitted their guesses
   */
  allPlayersGuessed() {
    return this.roundGuesses.size === this.players.size;
  }

  /**
   * Calculate scores for current round
   * Non-linear scoring system (0-1000 points):
   * - Uses exponential decay based on percentage error
   * - Closer guesses get disproportionately more points
   * - Perfect guess = 1000 points
   * - Score drops rapidly as error increases
   */
  calculateRoundScores() {
    if (this.currentItemIndex < 0) return [];

    const actualPrice = this.items[this.currentItemIndex].priceCents;
    const roundResults = [];
    
    // Sort guesses by timestamp to determine order
    const sortedGuesses = Array.from(this.roundGuesses.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    sortedGuesses.forEach(([playerId, guessData], index) => {
      const player = this.players.get(playerId);
      if (!player) return;

      const { guessCents, timestamp } = guessData;
      
      // NON-LINEAR ACCURACY SCORING (0-1000 points)
      // Calculate percentage error: |guess - actual| / actual
      const percentageError = Math.abs(guessCents - actualPrice) / actualPrice;
      
      // Exponential decay formula: 1000 * e^(-k * error)
      // k = 3 provides good balance: 
      // - 10% error ≈ 740 points
      // - 20% error ≈ 548 points
      // - 50% error ≈ 223 points
      // - 100% error ≈ 50 points
      const k = 3;
      const accuracyPoints = Math.max(0, Math.min(1000, Math.floor(1000 * Math.exp(-k * percentageError))));
      
      // Round points are always 0-1000, no multipliers or bonuses
      const totalPoints = accuracyPoints;
      
      player.score += totalPoints;

      roundResults.push({
        playerId,
        displayName: player.displayName,
        guess: guessCents,
        points: totalPoints,
        breakdown: {
          accuracyPoints,
          percentageError: Math.round(percentageError * 10000) / 100 // as percentage
        },
        totalScore: player.score,
        submissionOrder: index + 1
      });
    });

    return roundResults;
  }

  /**
   * Get leaderboard
   */
  getLeaderboard() {
    const entries = Array.from(this.players.values())
      .map(player => ({
        playerId: player.id,
        displayName: player.displayName,
        score: player.score
      }))
      .sort((a, b) => b.score - a.score);

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }

  /**
   * Update round duration (only in lobby)
   */
  updateRoundDuration(seconds) {
    if (this.status !== RoomStatus.LOBBY) {
      throw new Error('Cannot update settings: game already started');
    }
    if (seconds < 10 || seconds > 120) {
      throw new Error('Round duration must be between 10 and 120 seconds');
    }
    this.roundDurationSeconds = seconds;
  }

  /**
   * Get room state for API response
   */
  toJSON(revealPrice = false) {
    return {
      roomCode: this.roomCode,
      status: this.status,
      hostName: this.hostName,
      roundNumber: this.roundNumber,
      totalRounds: this.totalRounds,
      roundDurationSeconds: this.roundDurationSeconds,
      players: Array.from(this.players.values()).map(p => p.toJSON()),
      currentItem: this.getCurrentItem(revealPrice)
    };
  }

  /**
   * Clean up timers
   */
  cleanup() {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}
