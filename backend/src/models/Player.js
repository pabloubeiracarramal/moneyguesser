import { v4 as uuidv4 } from 'uuid';
import { generateAvatarColor } from '../utils/generateCode.js';

/**
 * Represents a player in the game
 */
export class Player {
  constructor(displayName) {
    this.id = uuidv4();
    this.displayName = displayName;
    this.avatarColor = generateAvatarColor();
    this.score = 0;
    this.currentGuess = null;
  }

  /**
   * Returns player data without sensitive information
   */
  toJSON() {
    return {
      id: this.id,
      displayName: this.displayName,
      avatarColor: this.avatarColor,
      score: this.score
    };
  }
}
