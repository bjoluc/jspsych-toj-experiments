import { TojPlugin } from "./jspsych-toj";

// async function support
import "core-js/stable";
import "regenerator-runtime/runtime";

export class TojImagePlugin extends TojPlugin {
  constructor() {
    super();
    this.info = {
      name: "toj-image",
      parameters: Object.assign({}, this.info.parameters, {
        probe_image: {
          type: jsPsych.plugins.parameterType.IMAGE,
          pretty_name: "TOJ Probe image",
          default: undefined,
          description: "The image to be used as the TOJ probe",
        },
        reference_image: {
          type: jsPsych.plugins.parameterType.IMAGE,
          pretty_name: "TOJ Reference image",
          default: undefined,
          description: "The image to be used as the TOJ reference",
        },
        probe_properties: {
          type: jsPsych.plugins.parameterType.OBJECT,
          pretty_name: "Probe image properties",
          default: {},
          description:
            "(optional) An object containing optional image properties. Allowed property keys are: `height`, `width`, `x`, `y`, and `css`.",
        },
        reference_properties: {
          type: jsPsych.plugins.parameterType.OBJECT,
          pretty_name: "Reference image properties",
          default: {},
          description:
            "(optional) An object containing optional image properties. Allowed property keys are: `height`, `width`, `x`, `y`, and `css`.",
        },
        hide_stimuli: {
          type: jsPsych.plugins.parameterType.BOOLEAN,
          pretty_name: "Hide stimuli",
          default: true,
          description:
            "(optional) Whether stimulus images (probe and reference) will be hidden initially. " +
            "This may depend on the modification function (e.g. showing stimuli vs. flashing stimuli).",
        },
      }),
    };

    // Delete `probe_element` and `reference_element` from the parameters – they are set by this
    // plugin.
    delete this.info.parameters.probe_element;
    delete this.info.parameters.reference_element;
  }

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
    const image = TojImagePlugin.createImageElement(imageSrc, "toj-background", imageProperties);
    this.container.appendChild(image);
    return image;
  }

  async trial(display_element, trial) {
    // Create stimulus image elements
    trial.probe_element = TojImagePlugin.createImageElement(
      trial.probe_image,
      "toj-probe",
      trial.probe_properties,
      trial.hide_stimuli
    );
    trial.reference_element = TojImagePlugin.createImageElement(
      trial.reference_image,
      "toj-reference",
      trial.reference_properties,
      trial.hide_stimuli
    );

    await super.trial(display_element, trial);
  }
}

const instance = new TojImagePlugin();
jsPsych.plugins["toj-image"] = instance;
export default instance;
