/**
 * @title Orientation TOJ Negation 1
 * @description Experiment on negation in TVA instructions (orientation-based version)
 * @version 2.0.0
 *
 * @imageDir images/common
 * @audioDir audio/orientation-toj-negation,audio/feedback
 * @miscDir misc
 */

"use strict";

import "../styles/main.scss";
import "../styles/bar-stimuli-angular.scss";

import { initJsPsych } from "jspsych";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";

import TojPlugin from "./plugins/jspsych-toj";
import DualNegationTojPlugin from "./plugins/jspsych-toj-negation-dual";

import delay from "delay";
import { sample, shuffle } from "lodash";
import randomInt from "random-int";

import { TouchAdapter } from "./util/TouchAdapter";
import { Scaler } from "./util/Scaler";
import { createBarStimulusGrid } from "./util/barStimuli";
import { setAbsolutePosition } from "./util/positioning";
import { Quadrant } from "./util/Quadrant";
import { addIntroduction } from "./util/introduction";

const soaChoices = [-6, -4, -3, -2, -1, 0, 1, 2, 3, 4, 6].map((x) => x * 16.667);

class TojTarget {
  /**
   * The quadrant in which the target is displayed
   * @type {Quadrant}
   */
  quadrant;

  /**
   * The target's orientation (horizontal or vertical)
   * @type {"horizontal"|"vertical"}
   */
  orientation;

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

  generateCondition(probeLeft) {
    const alpha = ConditionGenerator.alpha;
    const targetPairs = [];

    // Choose quadrants for targets
    const quadrantPairs = Quadrant.getRandomMixedSidePairs();

    // Choose orientations for the two target pairs
    const orientations = shuffle(["horizontal", "vertical"]);

    // Generate information for two pairs of targets
    for (let pairIndex = 0; pairIndex < 2; pairIndex++) {
      // Create a target pair
      const primary = new TojTarget();
      const secondary = new TojTarget();

      primary.quadrant = quadrantPairs[pairIndex][0];
      secondary.quadrant = quadrantPairs[pairIndex][1];

      // Set orientation
      const orientation = orientations[pairIndex];
      primary.orientation = orientation;
      secondary.orientation = orientation;

      // Set isProbe
      primary.isProbe = probeLeft ? primary.quadrant.isLeft() : !primary.quadrant.isLeft();
      secondary.isProbe = !primary.isProbe;

      [primary, secondary].map((target) => {
        target.gridPosition = ConditionGenerator.generateRandomPos(
          target.quadrant.isLeft() ? [3, 5] : [1, 3],
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

export async function run({ initOptions }) {
  const jsPsych = initJsPsych(initOptions);
  const timeline = [];

  const touchAdapterSpace = new TouchAdapter("space");
  const bindSpaceTouchAdapterToWindow = async () => {
    await delay(500); // Prevent touch event from previous touch
    touchAdapterSpace.bindToElement(window);
  };
  const unbindSpaceTouchAdapterFromWindow = () => {
    touchAdapterSpace.unbindFromElement(window);
  };

  const globalProps = addIntroduction(jsPsych, timeline, {
    skip: true,
    experimentName: "Orientation TOJ Negation",
    instructions: {
      en: `
You will see a grid of bars and a point in the middle. Please try to fixate the point during the whole experiment.
Four of the bars are darker, two of them horizontal, two vertical.
At the beginning of each trial, you will hear an instruction like "now horizontal" or "not vertical" (make sure to turn your sound on).
This informs you which  pair of bars is relevant for the respective trial.
Successively, each of the darker bars will flash once.
Based on this, your task is to decide which bar in the relevant pair flashed first.

If the left bar of the relevant pair flashed first, press **Q** (or tap on the left half of your screen).
If the right bar of the relevant pair flashed first, press **P** (or tap on the right half of your screen).

Please try to be as exact as possible and avoid mistakes.
If it is not clear to you whether the bar flashed first or second, you may guess the answer.

The experiment will start with a tutorial of 30 trials in which a sound at the end of each trial will indicate whether your answer was correct or not.
Note that the playback of audio may be delayed for some of the first trials.
      `,
      de: `
Sie sehen gleich ein Muster aus Balken und einen Punkt in der Mitte. Schauen sie möglichst während des gesamten Experimentes auf diesen Punkt.
Vier der Balken sind dunkler als die anderen, zwei senkrecht und zwei waagerecht.
Am Anfang jedes Durchgangs hören Sie eine Anweisung wie "jetzt senkrecht" oder "nicht waagerecht" (denken Sie daran, den Ton einzuschalten).
Diese sagt Ihnen, welches Paar (relevantes Paar) beurteilt werden soll.
Anschließend wird jeder der dunkleren Balken kurz blinken.
Ihre Aufgabe ist es, zu entscheiden, welcher der Balken des relevanten Paars zuerst geblinkt hat.

Hat der linke Balken des relevanten Paars zuerst geblinkt (vor dem anderen), drücken Sie **Q** (oder tippen Sie auf die linke Bildschirmhälfte).
Hat der rechte Balken des relevanten Paars zuerst geblinkt, drücken Sie **P** (oder tippen Sie auf die rechte Bildschirmhälfte).

Versuchen Sie, genau zu sein und keine Fehler zu machen.
Wenn Sie nicht wissen, welcher Strich zuerst war, raten Sie.

Das Experiment beginnt mit einem Tutorial von 30 Durchgängen, in dem Ihnen die Korrektheit jeder Antwort durch ein Geräusch rückgemeldet wird.
Die Audiowiedergabe kann bei den ersten Durchgängen leicht verzögert sein.

Falls Sie für üblich eine Brille tragen, setzen Sie diese bitte für das Experiment auf.
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

  const touchAdapterLeft = new TouchAdapter(leftKey);
  const touchAdapterRight = new TouchAdapter(rightKey);

  let scaler; // Will store the Scaler object for the TOJ plugin

  // Create TOJ plugin trial object
  const toj = {
    type: DualNegationTojPlugin,
    modification_function: (element) => TojPlugin.flashElement(element, "toj-flash", 30),
    soa: jsPsych.timelineVariable("soa"),
    probe_key: () => (jsPsych.timelineVariable("probeLeft") ? leftKey : rightKey),
    reference_key: () => (jsPsych.timelineVariable("probeLeft") ? rightKey : leftKey),
    instruction_negated: jsPsych.timelineVariable("isInstructionNegated"),
    instruction_voice: () => sample(["m", "f"]),
    instruction_base_directory: "media/audio/orientation-toj-negation",
    on_start: (trial) => {
      const probeLeft = jsPsych.timelineVariable("probeLeft");
      const condition = conditionGenerator.generateCondition(probeLeft);

      // Log probeLeft and condition
      trial.data = {
        probeLeft,
        condition,
      };

      trial.fixation_time = condition.targetPairs[0].fixationTime;
      trial.distractor_fixation_time = condition.targetPairs[1].fixationTime;
      trial.instruction_language = globalProps.instructionLanguage;

      // Set instruction color
      trial.instruction_filename =
        condition.targetPairs[trial.instruction_negated ? 1 : 0].primary.orientation;

      // Set distractor SOA
      trial.distractor_soa = condition.distractorSOA;
    },
    on_load: () => {
      const trial = jsPsych.getCurrentTrial();
      const { condition } = trial.data;

      const plugin = TojPlugin.current;

      const gridColor = "#777777";
      const targetColor = "#333333";

      // Loop over targets, creating them and their grids in the corresponding quadrants
      for (const targetPair of condition.targetPairs) {
        [targetPair.primary, targetPair.secondary].map((target) => {
          const [gridElement, targetElement] = createBarStimulusGrid(
            ConditionGenerator.gridSize,
            target.gridPosition,
            targetColor,
            gridColor,
            1,
            0.7,
            0.1,
            target.orientation == "horizontal" ? 0 : 90,
            condition.rotation
          );
          plugin.appendElement(gridElement);
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

      // Fit to window size
      scaler = new Scaler(
        plugin.container,
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
      timeline_variables: trials.slice(0, 10),
      play_feedback: true,
      randomize_order: true,
    },
    {
      timeline: [toj],
      conditional_function: () => globalProps.isFirstParticipation,
      timeline_variables: trials.slice(10, 30),
      play_feedback: true,
      randomize_order: true,
    },
    {
      type: HtmlKeyboardResponsePlugin,
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
    type: HtmlKeyboardResponsePlugin,
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

  await jsPsych.run(timeline);
  return jsPsych;
}
