import { TojPlugin } from "./TojPlugin";
import { playAudio } from "../util/audio";
import delay from "delay";

import { ParameterType } from "jspsych";

export class DualNegationTojPlugin extends TojPlugin {
  static info = {
    name: "toj-negation-dual",
    parameters: {
      ...TojPlugin.info.parameters,
      /**
       * A DOM element acting as a distracting probe stimulus. It is appended as a child to the
       * plugin's container.
       */
      distractor_probe_element: {
        type: ParameterType.OBJECT,
        pretty_name: "Distractor probe element",
        default: null,
      },
      /**
       * A DOM element acting as a distracting reference stimulus. It is appended as a child to the
       * plugin's container.
       */
      distractor_reference_element: {
        type: ParameterType.OBJECT,
        pretty_name: "Distractor reference element",
        default: null,
      },
      /**
       * (optional) The amount of time before the distractor stimulus element modification is
       * started
       */
      distractor_fixation_time: {
        type: ParameterType.INT,
        pretty_name: "Fixation time",
        default: 800,
      },
      /**
       * Stimulus onset asynchrony of the distractor stimuli
       */
      distractor_soa: {
        type: ParameterType.INT,
        pretty_name: "Distractor Stimulus Onset Asynchrony (SOA)",
        default: 0,
      },
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
      /**
       * The directory that contains the experiment's instruction audio files
       */
      instruction_base_directory: {
        type: ParameterType.STRING,
        pretty_name: "Instruction base directory",
        default: "media/audio/color-toj-negation",
      },
    },
  };

  async trial(display_element, trial, on_load) {
    TojPlugin.current = this;

    this._appendContainerToDisplayElement(display_element, trial);
    on_load();

    // Play instruction
    const audioBaseUrl = `${trial.instruction_base_directory}/${trial.instruction_language}/${trial.instruction_voice}/`;
    await playAudio(audioBaseUrl + (trial.instruction_negated ? "not" : "now") + ".wav");
    await playAudio(audioBaseUrl + trial.instruction_filename + ".wav");

    const modifyDistractorStimuli = async () => {
      await delay(trial.distractor_fixation_time);
      await TojPlugin.doTojModification(
        trial.distractor_probe_element,
        trial.distractor_reference_element,
        trial.modification_function,
        trial.distractor_soa
      );
    };

    await Promise.all([
      super.trial(display_element, trial, on_load, false),
      modifyDistractorStimuli(),
    ]);
  }
}

export default DualNegationTojPlugin;
