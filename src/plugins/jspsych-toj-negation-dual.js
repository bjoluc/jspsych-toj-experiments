import { TojPlugin } from "./jspsych-toj";
import { playAudio } from "../util/audio";
import delay from "delay";

export class TojNegationPlugin extends TojPlugin {
  constructor() {
    super();
    this.info = {
      name: "toj-negation",
      parameters: Object.assign(
        {
          distractor_probe_element: {
            type: jsPsych.plugins.parameterType.OBJECT,
            pretty_name: "Distractor probe element",
            default: null,
            description:
              "A DOM element acting as a distracting probe stimulus. It is appended as a child to the plugin's container.",
          },
          distractor_reference_element: {
            type: jsPsych.plugins.parameterType.OBJECT,
            pretty_name: "Distractor reference element",
            default: null,
            description:
              "A DOM element acting as a distracting reference stimulus. It is appended as a child to the plugin's container.",
          },
          distractor_fixation_time: {
            type: jsPsych.plugins.parameterType.INT,
            pretty_name: "Fixation time",
            default: 800,
            description:
              "(optional) The amount of time before the distractor stimulus element modification is started",
          },
          distractor_soa: {
            type: jsPsych.plugins.parameterType.INT,
            pretty_name: "Distractor Stimulus Onset Asynchrony (SOA)",
            default: 0,
            description: "Stimulus onset asynchrony of the distractor stimuli",
          },
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
        this.info.parameters
      ),
    };
  }

  async trial(display_element, trial) {
    this.appendContainer(display_element, trial);

    // Play instruction
    const audioBaseUrl = `media/audio/color-toj-negation/${trial.instruction_language}/${trial.instruction_voice}/`;
    await playAudio(audioBaseUrl + (trial.instruction_negated ? "not" : "now") + ".wav");
    await playAudio(audioBaseUrl + trial.instruction_color + ".wav");

    const modifyDistractorStimuli = async () => {
      await delay(trial.distractor_fixation_time);
      await TojPlugin.doTojModification(
        trial.distractor_probe_element,
        trial.distractor_reference_element,
        trial.modification_function,
        trial.distractor_soa
      );
    };

    await Promise.all([super.trial(display_element, trial, false), modifyDistractorStimuli()]);
  }
}

const instance = new TojNegationPlugin();
jsPsych.plugins["toj-negation-dual"] = instance;
export default instance;
