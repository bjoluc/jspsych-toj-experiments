/**
 * A jsPsych plugin for temporal order judgement tasks
 *
 * @author bjoluc
 * @version 1.0.0
 * @license MIT
 */

 "use strict";

 import delay from "delay";
 import { playAudio } from "../util/audio";
 
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
         description: "The key that the subject uses to give a 'probe first' response",
       },
       reference_key: {
         type: jsPsych.plugins.parameterType.KEYCODE,
         pretty_name: "Reference key",
         default: undefined,
         description: "The key that the subject uses to give a 'reference first' response",
       },
       fixation_mark_html: {
         type: jsPsych.plugins.parameterType.HTML_STRING,
         pretty_name: "Fixation mark HTML code",
         default:
           "<img class='toj-fixation-mark absolute-position' src='media/images/common/fixmark.png'></img>",
         description: "(optional) The HTML code of the fixation mark",
       },
       play_feedback: {
         type: jsPsych.plugins.parameterType.BOOLEAN,
         pretty_name: "Play feedback",
         default: false,
         description: "(optional) Whether ot not to play a feedback sound at the end of the trial",
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
 
   appendContainer(display_element, trial) {
     this.container.insertAdjacentHTML("beforeend", trial.fixation_mark_html);
     display_element.appendChild(this.container);
   }
 
   async trial(display_element, trial, appendContainer = true) {
     if (appendContainer) {
       this.appendContainer(display_element, trial);
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
       rt: keyboardResponse.rt,
     });
 
     if (trial.play_feedback) {
       await playAudio(`media/audio/feedback/${correct ? "right" : "wrong"}.wav`);
     }
 
     // Finish trial and log data
     jsPsych.finishTrial(resultData);
   }
 }
 
 const instance = new TojPlugin();
 jsPsych.plugins["toj"] = instance;
 export default instance;
 