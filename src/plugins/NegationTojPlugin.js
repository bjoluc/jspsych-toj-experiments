import { TojPlugin } from "./TojPlugin";
import { playAudio } from "../util/audio";

import { ParameterType } from "jspsych";

export class NegationTojPlugin extends TojPlugin {
  static info = {
    name: "toj-negation",
    parameters: {
      ...TojPlugin.info.parameters,
      /**
       * The filename (basename only) of the property to be used in the instruction
       */
      instruction_filename: {
        type: ParameterType.STRING,
        pretty_name: "Instruction filename",
        default: null,
      },
      /**
       * Whether the instruction is negated or not
       */
      instruction_negated: {
        type: ParameterType.STRING,
        pretty_name: "Instruction negated",
        default: null,
      },
      /**
       * The language ('en' or 'de') of the instruction
       */
      instruction_language: {
        type: ParameterType.STRING,
        pretty_name: "Instruction language",
        default: null,
      },
      /**
       * The voice of the instruction ('m' or 'f')
       */
      instruction_voice: {
        type: ParameterType.STRING,
        pretty_name: "Instruction voice",
        default: null,
      },
    },
  };

  async trial(display_element, trial, on_load) {
    TojPlugin.current = this;

    this._appendContainerToDisplayElement(display_element, trial);
    on_load();

    // Play instruction
    const audioBaseUrl = `media/audio/color-toj-negation/${trial.instruction_language}/${trial.instruction_voice}/`;
    await playAudio(audioBaseUrl + (trial.instruction_negated ? "not" : "now") + ".wav");
    await playAudio(audioBaseUrl + trial.instruction_filename + ".wav");

    await super.trial(display_element, trial, on_load, false);
  }
}

export default NegationTojPlugin;
