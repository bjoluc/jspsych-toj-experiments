/**
 * A class that allows to scale an element (and its children) proportionally to fit the window's
 * size.
 */
export class Scaler {
  /**
   * Initializes a new Scaler for a given DOM element.
   *
   * @param {Element} element The element to be scaled
   * @param {number} initialWidth The original with of the given element (in pixels)
   * @param {number} initialHeight The original height of the given element (in pixels)
   * @param {number} margin The space to leave from the border of each side of the screen (in pixels)
   */
  constructor(element, initialWidth, initialHeight, margin) {
    this._element = element;
    this._dimensions = { width: initialWidth, height: initialHeight };
    this._margin = margin;
    this._resizeToWindowSize();
    this._addEventListeners();
  }

  /**
   * Removes the event listeners. Call this if you do not use a scaler instance anymore.
   */
  destruct() {
    this._removeEventListeners();
  }

  _addEventListeners() {
    window.addEventListener("orientationchange", this._resizeToWindowSize);
    window.addEventListener("resize", this._resizeToWindowSize);
  }

  _removeEventListeners() {
    window.removeEventListener("orientationchange", this._resizeToWindowSize);
    window.removeEventListener("resize", this._resizeToWindowSize);
  }

  _resize(width, height) {
    const scale = Math.min(width / this._dimensions.width, height / this._dimensions.height);
    this._element.style.transform = `scale(${scale})`;
  }

  _resizeToWindowSize = (() => {
    this._resize(window.innerWidth - this._margin, window.innerHeight - this._margin);
  }).bind(this);
}
