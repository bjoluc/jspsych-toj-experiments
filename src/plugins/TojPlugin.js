"use strict";

import delay from "delay";
import { playAudio } from "../util/audio";

import { JsPsych, ParameterType } from "jspsych";
import { omit } from "lodash";

/**
 * A jsPsych plugin for temporal order judgement tasks
 *
 * @author bjoluc <mail@bjoluc.de>
 * @version 2.0.0
 * @license MIT
 */
export class TojPlugin {
  static info = {
    name: "toj-base",
    parameters: {
      /**
       * The DOM element acting as the probe stimulus. It is appended as a child to the plugin's
       * container.
       */
      probe_element: {
        type: ParameterType.OBJECT,
        pretty_name: "Probe element",
        default: null,
      },
      /**
       * The DOM element acting as the reference stimulus. It is appended as a child to the plugin's
       * container.
       */
      reference_element: {
        type: ParameterType.OBJECT,
        pretty_name: "Reference element",
        default: null,
      },
      /**
       * [optional] A (possibly asynchronous) function that takes a DOM element and modifies it in a
       * visible way (e.g. by showing, hiding, or flashing it). The function is executed once with
       * the probe element and once with the reference element as a parameter, where the succession
       * is determined by the trial's `SOA` parameter. Defaults to `TojPlugin.showElement`.
       */
      modification_function: {
        type: ParameterType.FUNCTION,
        pretty_name: "Modification function",
        default: TojPlugin.showElement,
      },
      /**
       * [optional] The length of the time before the stimulus element modification is started
       */
      fixation_time: {
        type: ParameterType.INT,
        pretty_name: "Fixation time",
        default: 800,
      },
      /**
       * The Stimulus Onset Asynchrony for the plugin's trial
       */
      soa: {
        type: ParameterType.INT,
        pretty_name: "Stimulus onset asynchrony (SOA)",
        default: undefined,
      },
      /**
       * The key that the subject uses to give a 'probe first' response
       */
      probe_key: {
        type: ParameterType.KEYCODE,
        pretty_name: "Probe key",
        default: undefined,
      },
      /**
       * The key that the subject uses to give a 'reference first' response
       */
      reference_key: {
        type: ParameterType.KEYCODE,
        pretty_name: "Reference key",
        default: undefined,
      },
      /**
       * [optional] The HTML code of the fixation mark
       */
      fixation_mark_html: {
        type: ParameterType.HTML_STRING,
        pretty_name: "Fixation mark HTML code",
        default:
          "<img class='toj-fixation-mark absolute-position' src='media/images/common/fixmark.png'></img>",
      },
      /**
       * [optional] Whether ot not to play a feedback sound at the end of the trial
       */
      play_feedback: {
        type: ParameterType.BOOLEAN,
        pretty_name: "Play feedback",
        default: false,
      },
    },
  };

  /**
   * The TojPlugin instance of the current trial (if a trial is currently running)
   * @type {TojPlugin|null}
   */
  static current = null;

  /**
   * Shows a DOM element and optionally hides it again after a specified timeout.
   *
   * @param {Element} element The DOM element to be shown
   * @param {number} hideAfter (optional) If set, the given DOM element will be hidden again after
   * the specified time in milliseconds has passed.
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
   * Given a two DOM elements, a SOA value, and a modification function, applies the modification
   * function to the elements according to the given SOA.
   *
   * @param {Element} probe
   * @param {Element} reference
   * @param {(element: Element) => Promise<void>} modificationFunction
   * @param {number} soa
   *
   */
  static async doTojModification(probe, reference, modificationFunction, soa) {
    if (soa < 0) {
      modificationFunction(probe);
      await delay(-soa);
      modificationFunction(reference);
    } else {
      modificationFunction(reference);
      if (soa != 0) {
        await delay(soa);
      }
      modificationFunction(probe);
    }
  }

  static __createContainer() {
    const container = document.createElement("div");
    container.id = "jspsych-toj-container";
    return container;
  }

  constructor(jsPsych) {
    /** @type {JsPsych} */
    this.jsPsych = jsPsych;
    this.container = TojPlugin.__createContainer();
  }

  /**
   * Appends a child to the plugin's container element
   *
   * @param {HTMLElement} element
   */
  appendElement(element) {
    this.container.appendChild(element);
  }

  /**
   * Like `jsPsych.pluginAPI.getKeyboardResponse`, but returns a promise instead of accepting a
   * `callback_function`.
   */
  getKeyboardResponsePromisified(options) {
    return new Promise((resolve, reject) => {
      this.jsPsych.pluginAPI.getKeyboardResponse({
        ...options,
        callback_function: resolve,
      });
    });
  }

  _appendContainerToDisplayElement(display_element, trial) {
    this.container.insertAdjacentHTML("beforeend", trial.fixation_mark_html);
    display_element.appendChild(this.container);
  }

  async trial(display_element, trial, on_load, standalone = true) {
    TojPlugin.current = this;

    if (standalone) {
      this._appendContainerToDisplayElement(display_element, trial);
      on_load();
    }

    await delay(trial.fixation_time);

    // Modify stimulus elements according to SOA
    await TojPlugin.doTojModification(
      trial.probe_element,
      trial.reference_element,
      trial.modification_function,
      trial.soa
    );

    let keyboardResponse = {
      rt: null,
      key: null,
    };

    keyboardResponse = await this.getKeyboardResponsePromisified({
      valid_responses: [trial.probe_key, trial.reference_key],
      rt_method: "performance",
      persist: false,
      allow_held_key: false,
    });

    // Clear the screen
    display_element.innerHTML = "";

    // Process the response
    let response = null;
    switch (keyboardResponse.key) {
      case trial.probe_key:
        response = "probe";
        break;
      case trial.reference_key:
        response = "reference";
        break;
    }

    let correct =
      (trial.soa <= 0 && response == "probe") || (trial.soa >= 0 && response == "reference");

    const resultData = {
      ...omit(trial, ["type", "fixation_mark_html", "probe_element", "reference_element"]),
      response_key: keyboardResponse.key,
      response: response,
      response_correct: correct,
      rt: keyboardResponse.rt,
    };

    if (trial.play_feedback) {
      await playAudio(`media/audio/feedback/${correct ? "right" : "wrong"}.wav`);
    }

    TojPlugin.current = null;

    // Finish trial and log data
    this.jsPsych.finishTrial(resultData);
  }
}

export default TojPlugin;
