/**
 * A class that allows to scale an element (and its children) proportionally to fit the window's
 * size.
 */
export default class Scaler {
  /**
   * Initializes a new Scaler for a given DOM element.
   *
   * @param {Element} element The element to be scaled
   * @param {number} initialWidth The original with of the given element (in pixels)
   * @param {number} initialHeight The original height of the given element (in pixels)
   * @param {number} margin The space to leave from the border of each side of the screen (in pixels)
   */
  constructor(element, initialWidth, initialHeight, margin) {
    this.element = element;
    this.dimensions = { width: initialWidth, height: initialHeight };
    this.margin = margin;
    this.resizeToWindowSize();
    this.addEventListeners();
  }

  addEventListeners() {
    window.addEventListener("orientationchange", this.resizeToWindowSize);
    window.addEventListener("resize", this.resizeToWindowSize);
  }

  removeEventListeners() {
    window.removeEventListener("orientationchange", this.resizeToWindowSize);
    window.removeEventListener("resize", this.resizeToWindowSize);
  }

  /**
   * Removes the event listeners. Call this if you do not use a scaler instance anymore.
   */
  destruct() {
    this.removeEventListeners();
  }

  resize(width, height) {
    const scale = Math.min(width / this.dimensions.width, height / this.dimensions.height);
    this.element.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  resizeToWindowSize = (() => {
    this.resize(window.innerWidth - this.margin, window.innerHeight - this.margin);
  }).bind(this);
}
