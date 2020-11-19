/**
 * @title Color TOJ Negation 2
 * @description Experiment on negation in TVA instructions, single-target-pair version
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
import tojNegationPlugin from "./plugins/jspsych-toj-negation";
import "./plugins/jspsych-toj-negation";

import delay from "delay";
import { sample } from "lodash";
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

const gridColor = "#777777";

class TojTarget {
  /**
   * The target's color
   * @type LabColor
   */
  color;

  /**
   * Whether the target is displayed on the left side of the screen
   * @type boolean
   */
  isLeft;

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

  static getRandomPrimaryColor() {
    return new LabColor(sample([0, 90, 180, 270]));
  }

  generatePosition(identifier, xRange = [2, 5], yRange = [2, 5]) {
    let pos;
    do {
      pos = ConditionGenerator._generateRandomPos(xRange, yRange);
    } while (pos == this._previousPositions[identifier]);
    this._previousPositions[identifier] = pos;
    return pos;
  }

  generateCondition(isProbeLeft) {
    const alpha = ConditionGenerator.alpha;

    // Generate a target pair
    const probe = new TojTarget();
    probe.isProbe = true;
    probe.isLeft = isProbeLeft;
    probe.color = ConditionGenerator.getRandomPrimaryColor();

    const reference = new TojTarget();
    reference.isProbe = false;
    reference.isLeft = !isProbeLeft;
    reference.color = ConditionGenerator.getRandomPrimaryColor();

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

  const globalProps = addIntroduction(timeline, {
    experimentName: "Color TOJ Negation 02",
    instructions: {
      en: `
You will see a grid of bars and a point in the middle. Please try to fixate the point during the whole experiment.
Two of the bars are colored (blue, yellow, red, or green).
At the beginning of each trial, you will hear an instruction like "now red" or "not yellow" (make sure to turn your sound on).
This informs you which of the bars is relevant for the respective trial.
Successively, each of the colored bars will flash once.
Based on this, your task is to decide whether the bar indicated by the instruction flashed first or second.

If it flashed first, press **Q** (or tap on the left half of your screen).
If it flashed second, press **P** (or tap on the right half of your screen).

Please try to be as exact as possible and avoid mistakes.
If it is not clear to you whether the bar flashed first or second, you may guess the answer.

If, for example, there is a green and a red bar and the voice says “not green” you will have to indicate whether the red bar flashed before the green one (i.e. first, response: **Q** or left tap) or after the green one (i.e. second, response **P** or right tap).

The experiment will start with a tutorial of 30 trials in which a sound at the end of each trial will indicate whether your answer was correct or not.
Note that the playback of audio may be delayed for some of the first trials.

If you usually wear glasses, please wear them for the experiment. If you have any form of color blindness, you cannot participate in this experiment.
      `,
      de: `
Sie sehen gleich ein Muster aus Strichen und einen Punkt in der Mitte. Schauen sie möglichst während des gesamten Experimentes auf diesen Punkt.
Zwei der Striche sind farbig (blau, gelb, rot oder grün).
Am Anfang jedes Durchgangs hören Sie eine Anweisung wie "jetzt rot" oder "nicht gelb" (denken Sie daran, den Ton einzuschalten).
Diese sagt Ihnen, welcher der beiden Striche beurteilt werden soll.
Anschließend wird jeder der farbigen Striche kurz blinken.
Ihre Aufgabe ist es, zu entscheiden, ob der in der Instruktion benannte Strich zuerst geblinkt hat oder als zweiter.

Hat er zuerst geblinkt (vor dem anderen), drücken Sie **Q** (oder tippen Sie auf die linke Bildschirmhälfte).
Hat er nach dem anderen, also als zweiter geblinkt, drücken Sie **P** (oder tippen Sie auf die rechte Bildschirmhälfte).

Versuchen Sie, genau zu sein und keine Fehler zu machen.
Wenn Sie nicht wissen, welcher Strich zuerst war, raten Sie.

Ein Beispiel: Wenn Sie einen grünen und einen roten Strich sehen und die Stimme „nicht grün“ sagt, müssen Sie den roten Strich beurteilen. Hat er vor dem grünen geblinkt? Dann **Q** drücken oder links tippen. Oder hat er nach dem grünen geblinkt? Dann **P** drücken oder rechts tippen.

Das Experiment beginnt mit einem Tutorial von 30 Durchgängen, in dem Ihnen die Korrektheit jeder Antwort durch ein Geräusch rückgemeldet wird.
Die Audiowiedergabe kann bei den ersten Durchgängen leicht verzögert sein.

Falls Sie für üblich eine Brille tragen, setzen Sie diese bitte für das Experiment auf. Falls Sie eine Farbfehlsichtigkeit haben können Sie nicht an diesem Experiment teilnehmen.
      `,
    },
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
      ).color.toName();
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
