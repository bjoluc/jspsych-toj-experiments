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
    name: "toj-base",
    parameters: {
      probe_element: {
        type: jsPsych.plugins.parameterType.OBJECT,
        pretty_name: "Probe element",
        default: null,
        description:
          "The DOM element acting as the probe stimulus. It is appended as a child to the plugin's container.",
      },
      reference_element: {
        type: jsPsych.plugins.parameterType.OBJECT,
        pretty_name: "Reference element",
        default: null,
        description:
          "The DOM element acting as the reference stimulus. It is appended as a child to the plugin's container.",
      },
      modification_function: {
        type: jsPsych.plugins.parameterType.FUNCTION,
        pretty_name: "Modification function",
        default: TojPlugin.showElement,
        description:
          "(optional) A (possibly asynchronous) function that takes a DOM element and modifies it in a " +
          "visible way (e.g. by showing, hiding, or flashing it). The function is executed once " +
          "with the probe element and once with the reference element as a parameter, where " +
          "the succession is determined by the trial's `SOA` parameter. Defaults to `TojPlugin.showElement`.",
      },
      fixation_time: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Fixation time",
        default: 800,
        description:
          "(optional) The length of the time before the stimulus element modification is started",
      },
      soa: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Stimulus onset asynchrony (SOA)",
        default: undefined,
        description: "The Stimulus Onset Asynchrony for the plugin's trial",
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
      fixation_mark_html: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: "Fixation mark HTML code",
        default:
          "<img class='toj-fixation-mark absolute-position' src='./images/fixmark.png'></img>",
        description: "(optional) The HTML code of the fixation mark",
      },
    },
  };

  constructor() {
    this.resetContainer();
  }

  resetContainer() {
    this.container = document.createElement("div");
    this.container.id = "jspsych-toj-container";
  }

  /**
   * Appends a child to the plugin's container element
   *
   * @param {Element} element
   */
  appendElement(element) {
    this.container.appendChild(element);
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
   * Like `jsPsych.pluginAPI.getKeyboardResponse`, but returns a promise instead of accepting a
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

  async trial(display_element, trial) {
    const probe = trial.probe_element;
    const reference = trial.reference_element;

    this.container.insertAdjacentHTML("beforeend", trial.fixation_mark_html);
    // TODO append targets in quick-toj

    display_element.appendChild(this.container);

    await delay(trial.fixation_time);

    let measuredSoa;

    const modificationFunction = trial.modification_function;
    // Modify stimulus elements according to SOA
    if (trial.soa < 0) {
      modificationFunction(probe);
      const probeModifiedTime = performance.now();
      await delay(-trial.soa);
      modificationFunction(reference);
      measuredSoa = probeModifiedTime - performance.now();
    } else {
      modificationFunction(reference);
      const referenceModifiedTime = performance.now();
      if (trial.soa != 0) {
        await delay(trial.soa);
      }
      modificationFunction(probe);
      measuredSoa = performance.now() - referenceModifiedTime;
    }

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

    const resultData = Object.assign({}, trial, {
      response_key: responseKey,
      response: response,
      response_correct: correct,
      measured_soa: measuredSoa,
      rt: keyboardResponse.rt,
    });

    // Finish trial and log data
    jsPsych.finishTrial(resultData);
  }
}

const instance = new TojPlugin();
jsPsych.plugins["toj"] = instance;
export default instance;
