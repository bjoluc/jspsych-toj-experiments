/**
 * @title Color TOJ Negation 3
 * @description Experiment on negation in TVA instructions (dual-colored version)
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
import tojNegationPlugin from "./plugins/jspsych-toj-negation-dual";
import "./plugins/jspsych-toj-negation-dual";
import estimateVsync from "vsync-estimate";

import delay from "delay";
import { sample, shuffle, isEqual } from "lodash";
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

function degreesToRgb(degrees) {
  return labDegreesToRgb(degrees, L, r);
}

function primaryColorDegToName(degrees) {
  degrees = degrees % 360;
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
   * The number of the quadrant in which the target is displayed
   */
  quadrant;

  /**
   * Whether the target is displayed in quadrant 2 or 3
   */
  get isLeft() {
    return [2, 3].includes(this.quadrant);
  }

  /**
   * Whether the target is displayed in quadrant 1 or 2
   */
  get isTop() {
    return [1, 2].includes(this.quadrant);
  }

  /**
   * Whether the target serves as a probe or a reference
   */
  isProbe;

  /**
   * Returns a random color degree value that differs from this target's color
   * by a multiple of 90 degree.
   */
  getDifferingPrimaryColorDeg() {
    return this.colorDeg + sample([90, 180, 270]);
  }

  /**
   * Position of the target within the bar grid ([x, y])
   */
  gridPosition;
}

class ConditionGenerator {
  /**
   * The size ([x, y]) of the grid in one quadrant
   */
  static gridSize = [7, 4];

  /**
   * Color variation (in LAB degree) between targets of a pair
   */
  static alpha = 20;

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
    return sample([0, 180]);
  }

  static generateColorDegOffset() {
    return 180;
  }

  generateCondition(probeLeft) {
    const alpha = ConditionGenerator.alpha;
    const targetPairs = [];

    // Generate information for two pairs of targets
    for (let pairIndex = 0; pairIndex < 2; pairIndex++) {
      // Generate a target pair

      const primary = new TojTarget();
      const secondary = new TojTarget();

      // Choose primary color
      if (pairIndex == 0) {
        // First pair
        primary.colorDeg = ConditionGenerator.generateRandomPrimaryColorDeg();
        secondary.colorDeg = primary.colorDeg + sample([alpha, -alpha]);
      } else {
        // 2nd pair: Primary target color has to differ from first pair color
        const offset = ConditionGenerator.generateColorDegOffset();
        primary.colorDeg = targetPairs[0].primary.colorDeg + offset;

        let secondaryColorOffsetOptions;
        switch (offset) {
          case -90:
            secondaryColorOffsetOptions = [-alpha];
            break;
          case 90:
            secondaryColorOffsetOptions = [alpha];
            break;
          default:
            secondaryColorOffsetOptions = [alpha, -alpha];
        }
        secondary.colorDeg = primary.colorDeg + sample(secondaryColorOffsetOptions);
      }

      targetPairs[pairIndex] = { primary, secondary, fixationTime: randomInt(300, 500) };
    }

    // Assign quadrants to targets

    function isValidPermutation(permutation) {
      // Invalid permutations are those which put a target pair in a column
      const firstPairPermutation = permutation.slice(0, 2);
      return [
        [1, 4],
        [4, 1],
        [2, 3],
        [3, 2],
      ].every((pattern) => !isEqual(pattern, firstPairPermutation));
    }

    let permutation;
    do {
      permutation = shuffle([1, 2, 3, 4]);
    } while (!isValidPermutation(permutation));

    targetPairs[0].primary.quadrant = permutation[0];
    targetPairs[0].secondary.quadrant = permutation[1];
    targetPairs[1].primary.quadrant = permutation[2];
    targetPairs[1].secondary.quadrant = permutation[3];

    // Set isProbe
    targetPairs.map(({ primary, secondary }) => {
      primary.isProbe = probeLeft ? primary.isLeft : !primary.isLeft;
      secondary.isProbe = !primary.isProbe;

      [primary, secondary].map((target) => {
        const xRange = target.isLeft ? [2, 5] : [1, 4];
        target.gridPosition = ConditionGenerator.generateRandomPos(xRange, [1, 2]);
      });
    });

    return {
      targetPairs,
      rotation: this.generateOrientation(),
      targetsToQuadrantMap: permutation,
      distractorSOA: sample(soaChoices),
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
    preamble: "<p>Welcome to the Color TOJ Negation 03 experiment!</P>",
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
          "Four of the bars are colored (red or green), where there are two pairs of similarly colored bars.<br/>" +
          'At the beginning of each trial, you will hear an instruction like "now red" or "not green" (make sure to turn your sound on).<br/>' +
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
          "Vier der Striche sind farbig (rot oder grün), wobei es jeweils zwei Paare von Strichen ähnlicher Farbe gibt.<br/>" +
          'Am Anfang jedes Durchgangs hören Sie eine Anweisung wie "jetzt rot" oder "nicht grün" (denken Sie daran, den Ton einzuschalten).<br/>' +
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
    probeLeft: [true, false],
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
    type: "toj-negation-dual",
    modification_function: (element) => TojPlugin.flashElement(element, "toj-flash", 30),
    soa: jsPsych.timelineVariable("soa"),
    probe_key: () => (jsPsych.timelineVariable("probeLeft", true) ? leftKey : rightKey),
    reference_key: () => (jsPsych.timelineVariable("probeLeft", true) ? rightKey : leftKey),
    instruction_negated: jsPsych.timelineVariable("isInstructionNegated"),
    instruction_voice: () => sample(["m", "f"]),
    on_start: async (trial) => {
      const probeLeft = jsPsych.timelineVariable("probeLeft", true);
      const cond = conditionGenerator.generateCondition(probeLeft);

      // Log probeLeft and condition
      trial.data = {
        probeLeft,
        condition: cond,
      };

      trial.fixation_time = cond.targetPairs[0].fixationTime;
      trial.distractor_fixation_time = cond.targetPairs[1].fixationTime;
      trial.instruction_language = globalProps.instructionLanguage;

      const gridColor = "#777777";

      // Loop over targets, creating them and their grids in the corresponding quadrants
      for (let i = 0; i < 2; i++) {
        const targetPair = cond.targetPairs[i];
        [targetPair.primary, targetPair.secondary].map((target) => {
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
            (target.isTop ? -1 : 1) * ConditionGenerator.gridSize[1] * 20
          );

          // Specify the elements for TOJ
          if (i == 0) {
            // Task-relevant target pair
            if (target.isProbe) {
              trial.probe_element = targetElement;
            } else {
              trial.reference_element = targetElement;
            }
          } else {
            // Distracting target pair
            if (target.isProbe) {
              trial.distractor_probe_element = targetElement;
            } else {
              trial.distractor_reference_element = targetElement;
            }
          }
        });
      }

      // Set instruction color
      trial.instruction_color = primaryColorDegToName(
        cond.targetPairs[trial.instruction_negated ? 1 : 0].primary.colorDeg
      );

      // Set distractor SOA
      trial.distractor_soa = cond.distractorSOA;
    },
    on_load: async () => {
      // Fit to window size
      scaler = new Scaler(
        document.getElementById("jspsych-toj-container"),
        ConditionGenerator.gridSize[0] * 40 * 2,
        ConditionGenerator.gridSize[1] * 40 * 2,
        10
      );
    },
    on_finish: () => {
      scaler.destruct();
      touchAdapterLeft.unbindFromAll();
      touchAdapterRight.unbindFromAll();
    },
  };

  // Tutorial
  timeline.push(
    {
      timeline: [toj],
      timeline_variables: trials.slice(0, globalProps.isFirstParticipation ? 30 : 10),
      play_feedback: true,
      randomize_order: true,
    },
    {
      type: "html-keyboard-response",
      stimulus: "<p>You finished the tutorial.</p><p>Press any key to continue.</p>",
      on_start: bindSpaceTouchAdapterToWindow,
      on_finish: unbindSpaceTouchAdapterFromWindow,
    }
  );

  // The trials array contains too many items for a block, so we divide the conditions into two
  // blocks. BUT: We cannot easily alternate between the first half and the second half of the
  // trials array in the `experimentTojTimeline` because the timeline_variables property does not
  // take a function. Hence, we manually create all timeline entries instead of using nested
  // timelines. :|

  const makeBlockFinishedScreenTrial = (block, blockCount) => ({
    type: "html-keyboard-response",
    stimulus: () => {
      if (block < blockCount) {
        return `<p>You finished block ${block} of ${blockCount}.<p/><p>Press any key to continue.</p>`;
      } else {
        return "<p>This part of the experiment is finished. Press any key to save the results!</p>";
      }
    },
    on_start: bindSpaceTouchAdapterToWindow,
    on_finish: unbindSpaceTouchAdapterFromWindow,
  });

  // Generator function to create the main experiment timeline
  const timelineGenerator = function* (blockCount) {
    let currentBlock = 1;
    while (currentBlock <= blockCount) {
      yield {
        timeline: [toj],
        // Alternate between first half and second half of trials array
        timeline_variables:
          currentBlock % 2 == 1
            ? trials.slice(0, trials.length / 2) // first half
            : trials.slice(trials.length / 2), // second half
        randomize_order: true,
      };
      yield makeBlockFinishedScreenTrial(currentBlock, blockCount);
      currentBlock += 1;
    }
  };

  // Main experiment
  timeline.push({
    timeline: Array.from(timelineGenerator(10)),
  });

  return timeline;
}
