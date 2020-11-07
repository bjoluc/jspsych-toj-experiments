/**
 * @title Color TOJ Negation
 * @description Experiment on negation in TVA instructions
 * @version 2.0.0
 *
 * @imageDir images/common
 * @audioDir audio/color-toj-negation,audio/feedback
 * @miscDir misc
 */

"use strict";

import "../styles/main.scss";

import "jspsych/plugins/jspsych-html-keyboard-response";
import { TojPlugin } from "./plugins/jspsych-toj";
import tojNegationPlugin from "./plugins/jspsych-toj-negation-dual";
import "./plugins/jspsych-toj-negation-dual";

import delay from "delay";
import { sample, shuffle, isEqual } from "lodash";
import randomInt from "random-int";

import { TouchAdapter } from "./util/TouchAdapter";
import { Scaler } from "./util/Scaler";
import { createBarStimulusGrid } from "./util/barStimuli";
import { setAbsolutePosition } from "./util/positioning";
import { LabColor } from "./util/colors";
import { addIntroduction } from "./util/introduction";

const soaChoices = [-6, -4, -3, -2, -1, 0, 1, 2, 3, 4, 6].map((x) => x * 16.667);

const L = 50;
const r = 50;

class TojTarget {
  /**
   * The target's color
   * @type LabColor
   */
  color;

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
   * @type boolean
   */
  isProbe;

  /**
   * Position of the target within the bar grid ([x, y])
   * @type number[]
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

  static getRandomPrimaryColor() {
    return new LabColor(sample([0, 90, 180, 270]));
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
        primary.color = ConditionGenerator.getRandomPrimaryColor();
        secondary.color = primary.color.getRandomRelativeColor([alpha, -alpha]);
      } else {
        // 2nd pair: Primary target color has to differ from first pair color
        const colorDegOffset = sample([-90, 90, 180]);
        primary.color = targetPairs[0].primary.color.getRelativeColor(colorDegOffset);

        let secondaryColorOffsetOptions;
        switch (colorDegOffset) {
          case -90:
            secondaryColorOffsetOptions = [-alpha];
            break;
          case 90:
            secondaryColorOffsetOptions = [alpha];
            break;
          default:
            secondaryColorOffsetOptions = [alpha, -alpha];
        }
        secondary.color = primary.color.getRelativeColor(sample(secondaryColorOffsetOptions));
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

  addIntroduction(timeline, globalProps, {
    experimentName: "Color TOJ Negation",
    instructions: {
      en: `
You will see a grid of bars and a point in the middle. Please try to focus at the point during the whole experiment.
Four of the bars are colored (blue, yellow, red, or green), where there are two pairs of similarly colored bars.
At the beginning of each trial, you will hear an instruction like "now red" or "not yellow" (make sure to turn your sound on).
This informs you which of the two pairs of bars is relevant for the respective trial; you can ignore the other pair then.
Successively, each of the colored bars will flash once.
Based on this, your task is to decide which of the two relevant bars has flashed first.

If it was the left one, press **Q** (or tap on the left half of your screen).
If it was the right one, press **P** (or tap on the right half of your screen).

Please try to be as exact as possible and avoid mistakes.
If it is not clear to you whether the left or the right bar flashed earlier, you may guess the answer.

The experiment will start with a tutorial in which a sound at the end of each trial will indicate whether your answer was correct or not.
Note that the playback of audio may be delayed for some of the first trials.
      `,
      de: `
Sie sehen gleich ein Muster aus Strichen und einen Punkt in der Mitte. Schauen sie möglichst während des gesamten Experimentes auf diesen Punkt.
Vier der Striche sind farbig (blau, gelb, rot oder grün), wobei es jeweils zwei Paare von Strichen ähnlicher Farbe gibt.
Am Anfang jedes Durchgangs hören Sie eine Anweisung wie "jetzt rot" oder "nicht gelb" (denken Sie daran, den Ton einzuschalten).
Diese sagt Ihnen, welches der beiden Paare für die weitere Aufgabe relevant ist; das jeweils andere Paar brauchen Sie nicht zu beachten.
Anschließend wird jeder der farbigen Striche kurz blinken.
Ihre Aufgabe ist es, zu entscheiden, welcher der beiden Striche des relevanten Paares zuerst geblinkt hat.

War es der Linke, drücken Sie **Q** (oder tippen auf die linke Bildschirmhälfte).
War es der Rechte, drücken Sie **P** (oder tippen auf die rechte Bildschirmhälfte).

Versuchen Sie, genau zu sein und keine Fehler zu machen.
Wenn Sie nicht wissen, welcher Strich zuerst war, raten Sie.

Das Experiment beginnt mit einem Tutorial, bei dem Ihnen die Korrektheit jeder Antwort durch ein Geräusch rückgemeldet wird.
Die Audiowiedergabe kann bei den ersten Durchgängen leicht verzögert sein.
      `,
    },
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
            target.color.toRgb(),
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
      trial.instruction_color = cond.targetPairs[
        trial.instruction_negated ? 1 : 0
      ].primary.color.toName();

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
