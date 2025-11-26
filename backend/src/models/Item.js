import { v4 as uuidv4 } from 'uuid';

/**
 * Represents an item in the game
 */
export class Item {
  constructor(label, imageUrl, priceCents) {
    this.id = uuidv4();
    this.label = label;
    this.imageUrl = imageUrl;
    this.priceCents = priceCents;
  }

  /**
   * Returns item data without price (for active rounds)
   */
  toJSONHidden() {
    return {
      id: this.id,
      label: this.label,
      imageUrl: this.imageUrl
    };
  }

  /**
   * Returns complete item data (for reveals)
   */
  toJSON() {
    return {
      id: this.id,
      label: this.label,
      imageUrl: this.imageUrl,
      priceCents: this.priceCents
    };
  }
}
