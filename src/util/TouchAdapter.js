/**
 * A convenience class that allows binding to the touchstart event of DOM elements and simulates a
 * specific key stroke on every touch.
 */
export class TouchAdapter {
  static bindEvent = "touchstart";

  /**
   * @param {number} keyCode The key code of the key to be simulated
   */
  constructor(keyCode) {
    this.keyDownEvent = new KeyboardEvent("keydown", { keyCode });
    this.keyUpEvent = new KeyboardEvent("keyup", { keyCode });
    this.elements = [];
  }

  simulateKeyPress() {
    const displayElement = document.querySelector(".jspsych-display-element");
    displayElement.dispatchEvent(this.keyDownEvent);
    displayElement.dispatchEvent(this.keyUpEvent);
  }

  eventListener = (event => {
    this.simulateKeyPress();
  }).bind(this);

  /**
   * Binds the TouchAdapter to a specified DOM element
   *
   * @param {Element} element The element to bind to
   */
  bindToElement(element) {
    element.addEventListener(TouchAdapter.bindEvent, this.eventListener);
    this.elements.push(element);
  }

  /**
   * Binds the TouchAdapter to a DOM element specified by its id
   *
   * @param {string} elementId The id of the DOM element to bind to
   */
  bindById(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      this.bindToElement(element);
    }
  }

  /**
   * Binds the TouchAdapter to all DOM elements that have the specified css class(es).
   *
   * @param {string} classNames The css class(es) of the DOM element(s) to bind to
   */
  bindByClass(classNames) {
    const elements = document.getElementsByClassName(classNames);
    for (let element of elements) {
      this.bindToElement(element);
    }
  }

  _unbindWithoutRemoval(element) {
    element.removeEventListener(TouchAdapter.bindEvent, this.eventListener);
  }

  /**
   * Unbinds the TouchAdapter from a specified DOM element
   *
   * @param {Element} element The element to bind to
   */
  unbindFromElement(element) {
    this._unbindWithoutRemoval(element);
    // Remove element from this.elements
    var index = this.elements.indexOf(element);
    if (index > -1) {
      this.elements = this.elements.splice(index, 1);
    }
  }

  /**
   * Unbinds the TouchAdapter from a DOM element specified by its id
   *
   * @param {string} elementId The id of the DOM element to unbind from
   */
  unbindById(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      this.unbindFromElement(element);
    }
  }

  /**
   * Unbinds the TouchAdapter from all DOM elements that have the specified css class(es).
   *
   * @param {string} classNames The css class(es) of the DOM element(s) to unbind from
   */
  unbindByClass(classNames) {
    const elements = document.getElementsByClassName(classNames);
    for (let element of elements) {
      this._unbindWithoutRemoval(element);
    }
  }

  /**
   * Unbinds the TouchAdapter from any DOM element it has been bound to.
   *
   */
  unbindFromAll() {
    for (let element of this.elements) {
    }
    this.elements = [];
  }
}
