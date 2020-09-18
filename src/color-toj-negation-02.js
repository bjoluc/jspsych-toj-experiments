/**
 * @title Color TOJ Negation 2
 * @description Experiment on negation in TVA instructions, single-target-pair version
 * @version 1.0.0
 *
 * @imageDir images/common
 * @audioDir audio/color-toj-negation,audio/feedback
 * @miscDir misc
 */

"use strict";

import "../styles/main.scss";

// jsPsych plugins
import "jspsych/plugins/jspsych-html-button-response";
import "jspsych/plugins/jspsych-html-keyboard-response";
import "jspsych/plugins/jspsych-survey-text";
import "jspsych/plugins/jspsych-survey-multi-choice";
import "jspsych/plugins/jspsych-fullscreen";
import { TojPlugin } from "./plugins/jspsych-toj";
import tojNegationPlugin from "./plugins/jspsych-toj-negation";
import "./plugins/jspsych-toj-negation";
import estimateVsync from "vsync-estimate";

import delay from "delay";
import { sample } from "lodash";
import randomInt from "random-int";
import { customAlphabet } from "nanoid";

import { TouchAdapter } from "./util/TouchAdapter";
import { Scaler } from "./util/Scaler";
import { createBarStimulusGrid } from "./util/barStimuli";
import { setAbsolutePosition } from "./util/positioning";
import { labDegreesToRgb } from "./util/colors";

const soaChoices = [-6, -4, -3, -2, -1, 0, 1, 2, 3, 4, 6].map((x) => x * 16.667);

const L = 50;
const r = 50;

const gridColor = "#777777";

function degreesToRgb(degrees) {
  return labDegreesToRgb(degrees, L, r);
}

class TojTarget {
  /**
   * The angle of the target's color in the LAB color space
   */
  colorDeg;

  /**
   * The target's color as a hexadecimal RGB color string
   */
  get colorRgb() {
    return degreesToRgb(this.colorDeg);
  }

  /**
   * The english name of the target's color
   */
  get colorName() {
    let degrees = this.colorDeg % 360;
    if (degrees < 0) {
      degrees = 360 + degrees;
    }
    switch (degrees) {
      case 0:
        return "red";
      case 90:
        return "yellow";
      case 180:
        return "green";
      case 270:
        return "blue";
      default:
        alert(degrees);
        return null;
    }
  }

  /**
   * Returns a random color degree value that differs from this target's color
   * by a multiple of 90 degree.
   */
  getDifferingPrimaryColorDeg() {
    return this.colorDeg + sample([90, 180, 270]);
  }

  /**
   * Whether the target is displayed on the left side of the screen
   */
  isLeft;

  /**
   * Whether the target serves as a probe or a reference
   */
  isProbe;

  /**
   * Position of the target within the bar grid ([x, y])
   */
  gridPosition;
}

class ConditionGenerator {
  /**
   * The size ([x, y]) of the grid in one quadrant
   */
  static gridSize = [7, 7];

  _previousOrientations = {};
  _previousPositions = {};

  generateOrientation(identifier = null) {
    let orientation;
    do {
      orientation = randomInt(0, 17) * 10;
    } while (identifier && orientation == this._previousOrientations[identifier]);
    if (identifier) {
      this._previousOrientations[identifier] = orientation;
    }
    return orientation;
  }

  static generateRandomPos(xRange, yRange) {
    return [randomInt(...xRange), randomInt(...yRange)];
  }

  generatePosition(identifier, xRange = [2, 5], yRange = [2, 5]) {
    let pos;
    do {
      pos = ConditionGenerator._generateRandomPos(xRange, yRange);
    } while (pos == this._previousPositions[identifier]);
    this._previousPositions[identifier] = pos;
    return pos;
  }

  static generateRandomPrimaryColorDeg() {
    return sample([0, 90, 180, 270]);
  }

  generateCondition(isProbeLeft) {
    const alpha = ConditionGenerator.alpha;

    // Generate a target pair
    const probe = new TojTarget();
    probe.isProbe = true;
    probe.isLeft = isProbeLeft;
    probe.colorDeg = ConditionGenerator.generateRandomPrimaryColorDeg();

    const reference = new TojTarget();
    reference.isProbe = false;
    reference.isLeft = !isProbeLeft;
    reference.colorDeg = probe.getDifferingPrimaryColorDeg();

    [probe, reference].map((target) => {
      const xRange = target.isLeft ? [3, 5] : [2, 4];
      target.gridPosition = ConditionGenerator.generateRandomPos(xRange, [2, 5]);
    });

    return {
      targets: { probe, reference },
      fixationTime: randomInt(300, 500),
      rotation: this.generateOrientation(),
    };
  }
}

const conditionGenerator = new ConditionGenerator();

const leftKey = "q",
  rightKey = "p";

export function createTimeline() {
  let timeline = [];

  const touchAdapterSpace = new TouchAdapter(
    jsPsych.pluginAPI.convertKeyCharacterToKeyCode("space")
  );
  const bindSpaceTouchAdapterToWindow = async () => {
    await delay(500); // Prevent touch event from previous touch
    touchAdapterSpace.bindToElement(window);
  };
  const unbindSpaceTouchAdapterFromWindow = () => {
    touchAdapterSpace.unbindFromElement(window);
  };

  // This is a hack to work around jsPsych.data.addProperties(). It seems like data set via
  // `jsPsych.data.addProperties()` cannot easily be retrieved within trials (bug?).
  const globalProps = {};

  timeline.push({
    type: "survey-multi-choice",
    preamble: "<p>Welcome to the Color TOJ Negation experiment!</P>",
    questions: [
      {
        prompt: "Is this the first time you participate in this experiment?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        prompt:
          "Most parts of this experiment are available in multiple languages. Please select a language.",
        options: ["Deutsch", "English"],
        required: true,
      },
    ],
    on_start: async (trial) => {
      const rate = await estimateVsync();
      trial.data.refreshRate = Math.round(rate);
    },
    on_finish: (trial) => {
      const responses = JSON.parse(trial.responses);
      const newProps = {
        isFirstParticipation: responses.Q0 === "Yes",
        instructionLanguage: responses.Q1 === "Deutsch" ? "de" : "en",
      };
      Object.assign(globalProps, newProps);
      jsPsych.data.addProperties(newProps);
    },
    data: {
      userAgent: navigator.userAgent,
    },
  });

  timeline.push({
    conditional_function: () => !globalProps.isFirstParticipation,
    timeline: [
      {
        type: "survey-text",
        questions: [
          {
            prompt:
              "<p>Please enter your participant code (the one you got the first time you participated in this experiment).</p>",
            required: true,
          },
        ],
        on_finish: (trial) => {
          const responses = JSON.parse(trial.responses);
          const newProps = {
            participantCode: responses.Q0,
          };
          Object.assign(globalProps, newProps);
          jsPsych.data.addProperties(newProps);
        },
      },
    ],
  });

  timeline.push({
    type: "html-button-response",
    stimulus: () => {
      return `<iframe class="declaration" src="media/misc/declaration_${globalProps.instructionLanguage}.html"></iframe>`;
    },
    choices: () => (globalProps.instructionLanguage === "en" ? ["I agree"] : ["Ich stimme zu"]),
  });

  timeline.push({
    conditional_function: () => globalProps.isFirstParticipation,
    timeline: [
      {
        type: "html-button-response",
        stimulus: () => {
          const nanoid = customAlphabet("ABCDEFGHJKLMNOPQRSTUVWXYZ", 4);
          const participantCode = nanoid();
          const newProps = { participantCode };
          Object.assign(globalProps, newProps);
          jsPsych.data.addProperties(newProps);
          return (
            `<p>Your participant code is <b>${participantCode}</b>.` +
            `</p><p><b>Important:</b> Please make sure to write it down somewhere. You will need it the next time you participate in this experiment!`
          );
        },
        choices: ["Done, let's continue"],
      },
    ],
  });

  timeline.push({
    conditional_function: () => globalProps.isFirstParticipation,
    timeline: [
      {
        type: "survey-text",
        questions: [{ prompt: "Please enter your age.", required: true }],
      },
      {
        type: "survey-multi-choice",
        questions: [
          {
            prompt: "Please choose your gender.",
            options: ["male", "female", "diverse"],
            required: true,
            horizontal: true,
          },
        ],
      },
    ],
  });

  // Switch to fullscreen
  timeline.push({
    type: "fullscreen",
    fullscreen_mode: true,
  });

  // Instructions
  timeline.push({
    type: "html-button-response",
    stimulus: () => {
      if (globalProps.instructionLanguage === "en") {
        return (
          "<p>You will see a grid of bars and a point in the middle. Please try to focus at the point during the whole experiment.<br/>" +
          "Four of the bars are colored (blue, yellow, red, or green), where there are two pairs of similarly colored bars.<br/>" +
          'At the beginning of each trial, you will hear an instruction like "now red" or "not yellow" (make sure to turn your sound on).<br/>' +
          "This informs you which of the two pairs of bars is relevant for the respective trial; you can ignore the other pair then.<br/>" +
          "Successively, each of the colored bars will flash once.<br/>" +
          "Based on this, your task is to decide which of the two relevant bars has flashed first." +
          "<p>If it was the left one, press <b>Q</b> (or tap on the left half of your screen).<br/>" +
          "If it was the right one, press <b>P</b> (or tap on the right half of your screen).</p>" +
          "<p>Please try to be as exact as possible and avoid mistakes.<br/>" +
          "If it is not clear to you whether the left or the right bar flashed earlier, you may guess the answer.</p>" +
          "<p>The experiment will start with a tutorial in which a sound at the end of each trial will indicate whether your answer was correct or not.</br>" +
          "Note that the playback of audio may be delayed for some of the first trials.<br/>"
        );
      } else {
        return (
          "<p>Sie sehen gleich ein Muster aus Strichen und einen Punkt in der Mitte. Schauen sie möglichst während des gesamten Experimentes auf diesen Punkt.<br/>" +
          "Vier der Striche sind farbig (blau, gelb, rot oder grün), wobei es jeweils zwei Paare von Strichen ähnlicher Farbe gibt.<br/>" +
          'Am Anfang jedes Durchgangs hören Sie eine Anweisung wie "jetzt rot" oder "nicht gelb" (denken Sie daran, den Ton einzuschalten).<br/>' +
          "Diese sagt Ihnen, welches der beiden Paare für die weitere Aufgabe relevant ist; " +
          "das jeweils andere Paar brauchen Sie nicht zu beachten.</br>" +
          "Anschließend wird jeder der farbigen Striche kurz blinken.<br/>" +
          "Ihre Aufgabe ist es, zu entscheiden, welcher der beiden Striche des relevanten Paares zuerst geblinkt hat." +
          "<p>War es der Linke, drücken Sie <b>Q</b> (oder tippen auf die linke Bildschirmhälfte).<br/>" +
          "War es der Rechte, drücken Sie <b>P</b> (oder tippen auf die rechte Bildschirmhälfte).</p>" +
          "<p>Versuchen Sie, genau zu sein und keine Fehler zu machen.<br/>" +
          "Wenn Sie nicht wissen, welcher Strich zuerst war, raten Sie.</p>" +
          "<p>Das Experiment beginnt mit einem Tutorial, bei dem Ihnen die Korrektheit jeder Antwort durch ein Geräusch rückgemeldet wird.<br/>" +
          "Die Audiowiedergabe kann bei den ersten Durchgängen leicht verzögert sein.<br/>"
        );
      }
    },
    choices: () =>
      globalProps.instructionLanguage === "en"
        ? ["Got it, start the tutorial"]
        : ["Alles klar, Tutorial starten"],
  });

  // Generate trials
  const factors = {
    isInstructionNegated: [true, false],
    isProbeLeft: [true, false],
    soa: soaChoices,
  };
  const repetitions = 1;
  let trials = jsPsych.randomization.factorial(factors, repetitions);

  const touchAdapterLeft = new TouchAdapter(
    jsPsych.pluginAPI.convertKeyCharacterToKeyCode(leftKey)
  );
  const touchAdapterRight = new TouchAdapter(
    jsPsych.pluginAPI.convertKeyCharacterToKeyCode(rightKey)
  );

  let scaler; // Will store the Scaler object for the TOJ plugin

  // Create TOJ plugin trial object
  const toj = {
    type: "toj-negation",
    modification_function: (element) => TojPlugin.flashElement(element, "toj-flash", 30),
    soa: jsPsych.timelineVariable("soa"),
    probe_key: leftKey,
    reference_key: rightKey,
    instruction_negated: jsPsych.timelineVariable("isInstructionNegated"),
    instruction_voice: () => sample(["m", "f"]),
    on_start: async (trial) => {
      const isProbeLeft = jsPsych.timelineVariable("isProbeLeft", true);
      const cond = conditionGenerator.generateCondition(isProbeLeft);

      // Log probeLeft and condition
      trial.data = {
        isProbeLeft,
        condition: cond,
      };

      trial.fixation_time = cond.fixationTime;
      trial.instruction_language = globalProps.instructionLanguage;

      // Create targets and grids
      [cond.targets.probe, cond.targets.reference].map((target) => {
        const [gridElement, targetElement] = createBarStimulusGrid(
          ConditionGenerator.gridSize,
          target.gridPosition,
          target.colorRgb,
          gridColor,
          1,
          0.7,
          0.1,
          cond.rotation
        );
        tojNegationPlugin.appendElement(gridElement);
        (target.isLeft ? touchAdapterLeft : touchAdapterRight).bindToElement(gridElement);

        setAbsolutePosition(
          gridElement,
          (target.isLeft ? -1 : 1) * ConditionGenerator.gridSize[0] * 20,
          0
        );

        // Specify the elements for TOJ
        if (target.isProbe) {
          trial.probe_element = targetElement;
        } else {
          trial.reference_element = targetElement;
        }
      });

      // Set instruction color
      trial.instruction_color = (trial.instruction_negated
        ? cond.targets.reference
        : cond.targets.probe
      ).colorName;
    },
    on_load: async () => {
      // Fit to window size
      scaler = new Scaler(
        document.getElementById("jspsych-toj-container"),
        ConditionGenerator.gridSize[0] * 40 * 2,
        ConditionGenerator.gridSize[1] * 40,
        10
      );
    },
    on_finish: () => {
      scaler.destruct();
      touchAdapterLeft.unbindFromAll();
      touchAdapterRight.unbindFromAll();
    },
  };

  // Create TOJ timelines
  const tutorialTojTimeline = {
    timeline: [toj],
    timeline_variables: trials.slice(0, 30),
    play_feedback: true,
    randomize_order: true,
  };

  const experimentTojTimeline = {
    timeline: [toj],
    timeline_variables: trials,
    randomize_order: true,
  };

  // Generator function to create timeline variables for blocks
  const blockGenerator = function* (blockCount) {
    let currentBlock = 1;
    while (currentBlock <= blockCount) {
      yield { block: currentBlock, blockCount };
      currentBlock += 1;
    }
  };

  const tutorialFinishedScreen = {
    type: "html-keyboard-response",
    stimulus: "<p>You finished the tutorial.</p><p>Press any key to continue.</p>",
    on_start: bindSpaceTouchAdapterToWindow,
    on_finish: unbindSpaceTouchAdapterFromWindow,
  };

  const blockFinishedScreen = {
    type: "html-keyboard-response",
    stimulus: () => {
      const block = jsPsych.timelineVariable("block", true);
      const blockCount = jsPsych.timelineVariable("blockCount", true);
      if (block < blockCount) {
        return `<p>You finished block ${block} of ${blockCount}.<p/><p>Press any key to continue.</p>`;
      } else {
        return "<p>This part of the experiment is finished. Press any key to save the results!</p>";
      }
    },
    on_start: bindSpaceTouchAdapterToWindow,
    on_finish: unbindSpaceTouchAdapterFromWindow,
  };

  // Add tutorial to main timeline
  timeline.push(tutorialTojTimeline, tutorialFinishedScreen);

  // Add experiment blocks to main timeline
  timeline.push({
    timeline: [experimentTojTimeline, blockFinishedScreen],
    timeline_variables: Array.from(blockGenerator(10)),
  });

  return timeline;
}
