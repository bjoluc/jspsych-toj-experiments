/**
 * A jsPsych plugin for temporal order judgement tasks
 *
 * @author bjoluc
 * @version 1.0.0
 * @license MIT
 */

"use strict";

// async function support
import "core-js/stable";
import "regenerator-runtime/runtime";
import delay from "delay";

export class TojPlugin {
  info = {
    name: "temporal-order-judgement",
    parameters: {
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
      hide_probe_after: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Probe presentation time",
        default: 0,
        description:
          "(optional) If set, the probe image is hidden after the specified time (in milliseconds) after it has been shown.",
      },
      hide_reference_after: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Reference presentation time",
        default: 0,
        description:
          "(optional) If set, the probe image is hidden after the specified time (in milliseconds) after it has been shown.",
      },
      fixation_mark_html: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: "Fixation mark HTML code",
        default: "<div class='toj-fixation-mark'>+</div>",
        description: "(optional) The HTML code of the fixation mark",
      },
      fixation_time: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Fixation time",
        default: 800,
        description:
          "(optional) The length of the time in which only the fixation mark is shown on the screen",
      },
      soa: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Stimulus onset asynchrony (SOA)",
        default: undefined,
        description: "The Stimulus onset asynchrony for the plugin's trial",
      },
      probe_key: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        pretty_name: "Probe key",
        default: undefined,
        description: "The key that the subject uses to select the probe",
      },
      reference_key: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        pretty_name: "Reference key",
        default: undefined,
        description: "The key that the subject uses to select the reference",
      },
      is_flash_toj: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        pretty_name: "Is Flash TOJ",
        default: false,
        description:
          "(optional) If set to true, probe and reference are both shown permanently and flash instead of appearing. " +
          "The flashing behaviour can optionally be specified via the flash_toj_flash_class and the flash_toj_flash_duration options.",
      },
      flash_toj_flash_class: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "CSS flash class for Flash TOJ",
        default: "toj-flash",
        description:
          "(optional) A css class that is applied to a stimulus during a flash. See is_flash_toj.",
      },
      flash_toj_flash_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Flash duration for Flash TOJ",
        default: 30,
        description: "(optional) The duration of a Flash TOJ flash. See is_flash_toj.",
      },
    },
  };

  constructor() {
    this.resetContainer();
  }

  resetContainer() {
    this.container = document.createElement("div");
    this.container.id = "jspsych-temporal-order-judgement-container";
  }

  /**
   * Appends an image element with the specified properties (created via `createImageElement`)
   * to `this.container`.
   *
   * @param {string} imageSrc The image's source
   * @param {string} cssClass The css class(es) that are applied to the image
   * @param {{height?: number, width?: number, x?: number, y?:number, css?:string}} imageProperties
   * Optional image properties
   * @param {boolean} hidden Whether to hide the image on creation. Defaults to true.
   *
   * @returns {Element} The DOM image element
   */
  addStimulusImage(imageSrc, cssClass, imageProperties, hidden = true) {
    const image = TojPlugin.createImageElement(imageSrc, cssClass, imageProperties);
    if (hidden) {
      TojPlugin.hideElement(image);
    }
    this.container.appendChild(image);
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
    const image = TojPlugin.createImageElement(imageSrc, "toj-background", imageProperties);
    this.container.appendChild(image);
    return image;
  }

  /**
   * Creates an image element with the specified properties.
   *
   * @param {Element} container The DOM element to append the image element to.
   * @param {string} imageSrc The image's source
   * @param {string} cssClass The css class(es) that are applied to the image
   * @param {{height?: number, width?: number, x?: number, y?:number, css?:string}} imageProperties
   * Optional image properties
   *
   * @returns {Element} The DOM image element
   */
  static createImageElement(imageSrc, cssClass, imageProperties = {}) {
    const image = document.createElement("img");

    if (imageProperties.hasOwnProperty("css")) {
      image.style = imageProperties["css"];
    }

    image.className = cssClass;
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

    return image;
  }

  /**
   * Shows a DOM element and optionally hides it again after a specified timeout.
   *
   * @param {Element} element The DOM element to be shown
   * @param {number} hideAfter (optional) If set, the given DOM element will be hidden again after the
   * specified time in milliseconds has passed.
   */
  static showElement(element, hideAfter = 0) {
    element.style.visibility = "visible";
    if (hideAfter !== 0) {
      window.setTimeout(TojPlugin.hideElement, hideAfter, element);
    }
  }

  /**
   * Hides a DOM element.
   *
   * @param {Element} element The DOM element to be hidden
   */
  static hideElement(element) {
    element.style.visibility = "hidden";
  }

  /**
   * Makes an element flash by temporarily applying a specified css class.
   *
   * @param {Element} element
   * @param {string} flashClass
   * @param {number} flashDuration
   */
  static async flashElement(element, flashClass, flashDuration) {
    element.classList.add(flashClass);
    await delay(flashDuration);
    element.classList.remove(flashClass);
  }

  /**
   * Like `jsPsych.pluginAPI.getKeyboardResponse`, but returns a promise and does not accept
   * `callback_function`.
   */
  static getKeyboardResponsePromised(options) {
    return new Promise((resolve, reject) => {
      jsPsych.pluginAPI.getKeyboardResponse({
        ...options,
        callback_function: resolve,
      });
    });
  }

  trial = async (display_element, trial) => {
    const isFlashToj = trial.is_flash_toj;

    this.container.innerHTML = trial.fixation_mark_html;
    display_element.appendChild(this.container);

    // Create stimulus image elements
    const probe = this.addStimulusImage(
      trial.probe_image,
      "toj-probe",
      trial.probe_properties,
      !isFlashToj
    );
    const reference = this.addStimulusImage(
      trial.reference_image,
      "toj-reference",
      trial.reference_properties,
      !isFlashToj
    );

    await delay(trial.fixation_time);

    let modificationFunction;
    if (isFlashToj) {
      modificationFunction = element => {
        TojPlugin.flashElement(
          element,
          trial.flash_toj_flash_class,
          trial.flash_toj_flash_duration
        );
      };
    } else {
      modificationFunction = TojPlugin.showElement;
    }
    // Modify image elements according to SOA
    if (trial.soa < 0) {
      modificationFunction(probe);
      await delay(-trial.soa);
      modificationFunction(reference);
    } else {
      modificationFunction(reference);
      if (trial.soa != 0) {
        await delay(trial.soa);
      }
      modificationFunction(probe);
    }

    // Variable for keyboard response
    let keyboardResponse = {
      rt: null,
      key: null,
    };

    keyboardResponse = await TojPlugin.getKeyboardResponsePromised({
      valid_responses: [trial.probe_key, trial.reference_key],
      rt_method: "performance",
      persist: false,
      allow_held_key: false,
    });

    // Clear the screen
    display_element.innerHTML = "";
    this.resetContainer();

    // Process the response
    let responseKey = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(keyboardResponse.key);
    let response = null;
    switch (responseKey) {
      case trial.probe_key:
        response = "probe";
        break;
      case trial.reference_key:
        response = "reference";
        break;
    }

    let correct =
      (trial.soa <= 0 && response == "probe") || (trial.soa >= 0 && response == "reference");

    // Finish trial and log data
    jsPsych.finishTrial({
      probe_image: trial.probe_image,
      reference_image: trial.reference_image,
      probe_properties: trial.probe_properties,
      reference_properties: trial.reference_properties,
      hide_probe_after: trial.hide_probe_after,
      hide_reference_after: trial.hide_reference_after,
      fixation_mark_html: trial.fixation_mark_html,
      fixation_time: trial.fixation_time,
      soa: trial.soa,
      probe_key: trial.probe_key,
      reference_key: trial.reference_key,
      is_flash_toj: trial.is_flash_toj,
      flash_toj_flash_class: trial.flash_toj_flash_class,
      flash_toj_flash_duration: trial.flash_toj_flash_duration,
      response_key: responseKey,
      response: response,
      response_correct: correct,
      rt: keyboardResponse.rt,
    });
  };
}

const instance = new TojPlugin();
jsPsych.plugins["temporal-order-judgement"] = instance;
export default instance;
