import { TojPlugin } from "./jspsych-toj";
import { playAudio } from "../util/audio";

export class TojNegationPlugin extends TojPlugin {
  constructor() {
    super();
    this.info = {
      name: "toj-negation",
      parameters: {
        ...this.info.parameters,
        instruction_color: {
          type: jsPsych.plugins.parameterType.STRING,
          pretty_name: "Instruction color",
          default: null,
          description: "The color to be named in the instruction",
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
  }

  async trial(display_element, trial) {
    this.appendContainer(display_element, trial);

    // Play instruction
    const audioBaseUrl = `media/audio/color-toj-negation/${trial.instruction_language}/${trial.instruction_voice}/`;
    await playAudio(audioBaseUrl + (trial.instruction_negated ? "not" : "now") + ".wav");
    await playAudio(audioBaseUrl + trial.instruction_color + ".wav");

    await super.trial(display_element, trial, false);
  }
}

const instance = new TojNegationPlugin();
jsPsych.plugins["toj-negation"] = instance;
export default instance;
