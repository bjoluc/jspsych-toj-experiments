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
import { sample } from "lodash";
import randomInt from "random-int";

import { TouchAdapter } from "./util/TouchAdapter";
import { Scaler } from "./util/Scaler";
import { createBarStimulusGrid } from "./util/barStimuli";
import { setAbsolutePosition } from "./util/positioning";
import { LabColor } from "./util/colors";
import { Quadrant } from "./util/Quadrant";
import { addIntroduction } from "./util/introduction";

const soaChoices = [-6, -4, -3, -2, -1, 0, 1, 2, 3, 4, 6].map((x) => x * 16.667);

class TojTarget {
  /**
   * The target's color
   * @type {LabColor}
   */
  color;

  /**
   * The quadrant in which the target is displayed
   * @type {Quadrant}
   */
  quadrant;

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

    // Choose quadrants for targets
    const quadrantPairs = Quadrant.getRandomMixedSidePairs();

    // Generate information for two pairs of targets
    for (let pairIndex = 0; pairIndex < 2; pairIndex++) {
      // Create a target pair
      const primary = new TojTarget();
      const secondary = new TojTarget();

      primary.quadrant = quadrantPairs[pairIndex][0];
      secondary.quadrant = quadrantPairs[pairIndex][1];

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

      primary.isProbe = probeLeft ? primary.quadrant.isLeft() : !primary.quadrant.isLeft();
      secondary.isProbe = !primary.isProbe;

      [primary, secondary].map((target) => {
        target.gridPosition = ConditionGenerator.generateRandomPos(
          target.quadrant.isLeft() ? [2, 5] : [1, 4],
          [1, 2]
        );
      });

      targetPairs[pairIndex] = { pairIndex, primary, secondary, fixationTime: randomInt(300, 500) };
    }

    return {
      targetPairs,
      rotation: this.generateOrientation(),
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

  const globalProps = addIntroduction(timeline, {
    skip: false,
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
      for (const targetPair of cond.targetPairs) {
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
          (target.quadrant.isLeft() ? touchAdapterLeft : touchAdapterRight).bindToElement(
            gridElement
          );

          setAbsolutePosition(
            gridElement,
            (target.quadrant.isLeft() ? -1 : 1) * ConditionGenerator.gridSize[0] * 20,
            (target.quadrant.isTop() ? -1 : 1) * ConditionGenerator.gridSize[1] * 20
          );

          // Specify the elements for TOJ
          if (targetPair.pairIndex == 0) {
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
      trial.instruction_filename = cond.targetPairs[
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
