import { TojPlugin } from "./TojPlugin";

import { ParameterType } from "jspsych";

/**
 * An image extension to the jsPsych TojPlugin
 *
 * @author bjoluc <mail@bjoluc.de>
 * @version 2.0.0
 * @license MIT
 */
export class ImageTojPlugin extends TojPlugin {
  static info = {
    name: "toj-image",
    parameters: {
      // Delete `probe_element` and `reference_element` parameters (they are set by this plugin):
      ...(({ probe_element, reference_element, ...parameters }) => parameters)(
        TojPlugin.info.parameters
      ),
      /**
       * The image to be used as the TOJ probe
       */
      probe_image: {
        type: ParameterType.IMAGE,
        pretty_name: "TOJ Probe image",
        default: undefined,
      },
      /**
       * The image to be used as the TOJ reference
       */
      reference_image: {
        type: ParameterType.IMAGE,
        pretty_name: "TOJ Reference image",
        default: undefined,
      },
      /**
       * [optional] An object containing optional image properties. Allowed property keys are:
       * `height`, `width`, `x`, `y`, and `css`.
       */
      probe_properties: {
        type: ParameterType.OBJECT,
        pretty_name: "Probe image properties",
        default: {},
      },
      /**
       * [optional] An object containing optional image properties. Allowed property keys are:
       * `height`, `width`, `x`, `y`, and `css`.
       */
      reference_properties: {
        type: ParameterType.OBJECT,
        pretty_name: "Reference image properties",
        default: {},
      },
      /**
       * [optional] Whether stimulus images (probe and reference) will be hidden initially. This may
       * depend on the modification function (e.g. showing stimuli vs. flashing stimuli).
       */
      hide_stimuli: {
        type: ParameterType.BOOLEAN,
        pretty_name: "Hide stimuli",
        default: true,
      },
    },
  };

  /**
   * The ImageTojPlugin instance of the current trial (if a trial is currently running)
   * @type {ImageTojPlugin|null}
   */
  static current = null;

  /**
   * Creates an image element with the specified properties.
   *
   * @param {Element} container The DOM element to append the image element to.
   * @param {string} imageSrc The image's source
   * @param {string} cssClass The css class(es) that are applied to the image
   * @param {{height?: number, width?: number, x?: number, y?:number, css?:string}} imageProperties
   *        Optional image properties
   * @param {boolean} hidden Whether to hide the image on creation.
   *
   * @returns {Element} The DOM image element
   */
  static createImageElement(imageSrc, cssClass, imageProperties = {}, hidden) {
    const image = document.createElement("img");

    if (imageProperties.hasOwnProperty("css")) {
      image.style = imageProperties["css"];
    }

    image.className = cssClass + " absolute-position";
    image.src = imageSrc;

    if (imageProperties.hasOwnProperty("width")) {
      image.setAttribute("width", imageProperties["width"]);
    }
    if (imageProperties.hasOwnProperty("height")) {
      image.setAttribute("height", imageProperties["height"]);
    }
    if (imageProperties.hasOwnProperty("x")) {
      image.style.marginLeft = imageProperties["x"] + "px";
    }
    if (imageProperties.hasOwnProperty("y")) {
      image.style.marginTop = imageProperties["y"] + "px";
    }

    if (hidden) {
      TojPlugin.hideElement(image);
    }

    return image;
  }

  /**
   * Appends an image element with the specified properties (created via `createImageElement`) and
   * the css class 'toj-background' to `this.container`.
   *
   * @param {string} imageSrc The image's source
   * @param {{height?: number, width?: number, x?: number, y?:number, css?:string}} imageProperties
   * Optional image properties
   *
   * @returns {Element} The DOM image element
   */
  addBackgroundImage(imageSrc, imageProperties) {
    const image = ImageTojPlugin.createImageElement(imageSrc, "toj-background", imageProperties);
    this.appendElement(image);
    return image;
  }

  async trial(display_element, trial, on_load) {
    ImageTojPlugin.current = this;
    this._appendContainerToDisplayElement(display_element, trial);

    // Create stimulus image elements
    trial.probe_element = ImageTojPlugin.createImageElement(
      trial.probe_image,
      "toj-probe",
      trial.probe_properties,
      trial.hide_stimuli
    );
    trial.reference_element = ImageTojPlugin.createImageElement(
      trial.reference_image,
      "toj-reference",
      trial.reference_properties,
      trial.hide_stimuli
    );

    // Append stimulus image elements to container
    this.appendElement(trial.probe_element);
    this.appendElement(trial.reference_element);

    on_load();

    await super.trial(display_element, trial, on_load, false);
    ImageTojPlugin.current = null;
  }
}

export default ImageTojPlugin;
