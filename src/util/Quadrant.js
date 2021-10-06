"use strict";

import randomInt from "random-int";

/**
 * Represents a quadrant (numbered like in a cartesian coordinate system, but starting with 0)
 */
export class Quadrant {
  /**
   * The number of the quadrant (0 to 3)
   * @type {number}
   */
  number;

  /**
   * Create a new `Quadrant` object.
   *
   * @param {number} number The number of the quadrant (0 to 3)
   */
  constructor(number) {
    this.number = number;
  }

  /**
   * Whether this is a quadrant on the left side
   */
  isLeft() {
    return [1, 2].includes(this.number);
  }

  /**
   * Whether this is one of the two upper quadrants
   */
  isTop() {
    return [0, 1].includes(this.number);
  }

  /**
   * Returns the quadrant above/below.
   */
  getSiblingVertical() {
    return new Quadrant(3 - this.number);
  }

  /**
   * Returns the quadrant to the left/right.
   */
  getSiblingHorizontal() {
    return new Quadrant([1, 0, 3, 2][this.number]);
  }

  /**
   * Returns the quadrant at the diagonally opposite site.
   */
  getSiblingDiagonal() {
    return new Quadrant((this.number + 2) % 4);
  }

  /**
   * Returns a random `Quadrant`.
   */
  static getRandom() {
    return new Quadrant(randomInt(0, 3));
  }

  /**
   * Returns two random pairs of quadrants where a pair always consists of a quadrant on each side
   * (left/right).
   */
  static getRandomMixedSidePairs() {
    const a = Quadrant.getRandom();
    const isCross = randomInt(0, 1);
    return [
      [a, isCross ? a.getSiblingDiagonal() : a.getSiblingHorizontal()],
      [a.getSiblingVertical(), isCross ? a.getSiblingHorizontal() : a.getSiblingDiagonal()],
    ];
  }
}
