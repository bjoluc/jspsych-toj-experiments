/**
 * Sets an absolute position for an element within the TOJ plugin's container. The screen center is
 * specified as x = 0, y = 0.
 *
 * Note: This method applies the absolute-position css class and sets margin values for the provided
 * element.
 *
 * @param {HTMLElement} element The element to be positioned absolutely.
 * @param {number} x The x position in pixels, relative to the screen center (negative values =
 *                   left, positive values = right)
 * @param {number} y The y position in pixels, relative to the screen center (negative values =
 *                   bottom, positive values = top)
 */
export function setAbsolutePosition(element, x = 0, y = 0) {
  element.className += " absolute-position";
  element.style.marginLeft = x + "px";
  element.style.marginTop = y + "px";
}
