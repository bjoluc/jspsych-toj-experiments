"use strict";

import { lab } from "d3-color";
import { sample } from "lodash";

export class LabColor {
  static L = 50;
  static r = 50;

  static degreesToRgb(degrees) {
    const angle = (degrees * Math.PI) / 180;
    return lab(LabColor.L, LabColor.r * Math.cos(angle), LabColor.r * Math.sin(angle))
      .rgb()
      .toString();
  }

  degrees;

  /**
   *
   * @param {number} degrees The degrees of the desired color in the LAB color space
   */
  constructor(degrees) {
    this.degrees = degrees;
  }

  /**
   * Returns the hexadecimal color string of the color.
   */
  toRgb() {
    return LabColor.degreesToRgb(this.degrees);
  }

  /**
   * Returns the natural-language name of the color as a string (only works for multiples of 90°).
   */
  toName() {
    let degrees = this.degrees % 360;
    if (degrees < 0) {
      degrees += 360;
    }
    switch (degrees) {
      case 0:
        return "red";
      case 90:
        return "yellow";
      case 180:
        return "green";
      case 270:
        return "blue";
      default:
        throw new Error(`${degrees}° could not be converted to a color name.`);
    }
  }

  /**
   * Returns a new `LabColor` object whose degree value differs from this color's degree value by `deltaDegrees`.
   *
   * @param {number} deltaDegrees The number of degrees by which the returned color should differ from this color.
   */
  getRelativeColor(deltaDegrees) {
    return new LabColor(this.degrees + deltaDegrees);
  }

  /**
   * Like `getRelativeColor()`, but uniformly chooses the `deltaDegrees` parameter at random out of a provided list of options.
   *
   * @param {number[]} deltaDegreeOptions A list of options for the `deltaDegrees` value of the `getRelativeColor()` function
   */
  getRandomRelativeColor(deltaDegreeOptions) {
    return this.getRelativeColor(sample(deltaDegreeOptions));
  }
}
