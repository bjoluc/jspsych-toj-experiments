/**
 * A jsPsych plugin for temporal order judgement tasks
 * extensions: negation through voice + judge whether first or second
 *
 * @author bjoluc and Psylab UPB
 * @version 1.0.0
 * @license MIT
 */

"use strict";

import delay from "delay";
import { playAudio } from "../util/audio";
import { TojPlugin } from "./jspsych-toj";

export class TojPluginWhichFirst extends TojPlugin {
  info = {
    name: "toj-which_first",
    parameters: {
      ...this.info.parameters,
      greenCalled: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        pretty_name: "was green called",
        default: true,
        description:
          "Was the green element called by the voice",
      },
      first_key: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        pretty_name: "First key",
        default: undefined,
        description: "The key that the subject uses to give a queried stimulus was first response",
      },
      second_key: {
        type: jsPsych.plugins.parameterType.KEYCODE,
        pretty_name: "Second key",
        default: undefined,
        description: "The key that the subject uses to give a queried stimulus was second response",
      },
      instruction_filename: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Instruction filename",
        default: null,
        description: "The filename (basename only) of the property to be used in the instruction",
      },
      instruction_negated: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Instruction negated",
        default: null,
        description: "Whether the instruction is negated or not",
      },
      instruction_language: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Instruction language",
        default: null,
        description: "The language ('en' or 'de') of the instruction",
      },
      instruction_voice: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: "Instruction voice",
        default: null,
        description: "The voice of the instruction ('m' or 'f')",
      },
    },
  };

  async trial(display_element, trial, appendContainer = true) {

    this.appendContainer(display_element, trial);

    // Play instruction
    const audioBaseUrl = `media/audio/color-toj-negation/${trial.instruction_language}/${trial.instruction_voice}/`;
    await playAudio(audioBaseUrl + (trial.instruction_negated ? "not" : "now") + ".wav");
    await playAudio(audioBaseUrl + trial.instruction_filename + ".wav");

    if (appendContainer) {
      this.appendContainer(display_element, trial);
    }

    await delay(trial.fixation_time);

    // Modify stimulus elements according to SOA
    await TojPluginWhichFirst.doTojModification(
      trial.probe_element,
      trial.reference_element,
      trial.modification_function,
      trial.soa
    );

    let keyboardResponse = {
      rt: null,
      key: null,
    };

    keyboardResponse = await TojPluginWhichFirst.getKeyboardResponsePromised({
      valid_responses: [trial.first_key, trial.second_key],
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
      case trial.first_key:
        response = "first";
        break;
      case trial.second_key:
        response = "second";
        break;
    }


    let isGreen =  trial.greenCalled !== trial.instruction_negated

    let isFirst = (trial.soa < 0 === isGreen)

    let correct = ((isFirst === (response === "first")) || trial.soa === 0);

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

const instance = new TojPluginWhichFirst();
jsPsych.plugins["toj-which_first"] = instance;
export default instance;
