/**
 * @title Color TOJ Hue
 * @description A TOJ experiment to measure color salience
 * @version 3.0.0
 *
 * @imageDir images/common
 */

"use strict";

import "../styles/main.scss";

import { initJsPsych } from "jspsych";

import SurveyTextPlugin from "@jspsych/plugin-survey-text";
import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";

import TojPlugin from "./plugins/TojPlugin";

import delay from "delay";
import sample from "lodash/sample";
import shuffle from "lodash/shuffle";
import randomInt from "random-int";

import { TouchAdapter } from "./util/TouchAdapter";
import { Scaler } from "./util/Scaler";
import { createBarStimulusGrid } from "./util/barStimuli";
import { setAbsolutePosition } from "./util/positioning";
import { LabColor } from "./util/colors";

class ConditionGenerator {
  static gridSize = 7;

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

  mirrorOrientation(orientation) {
    return (orientation + 90) % 180;
  }

  static _generateRandomPos(xRange, yRange) {
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
    const cond = {};

    const [colorDegLeft, colorDegRight] = shuffle([-90, 90]);
    cond.colorLeft = new LabColor(colorDegLeft);
    cond.colorRight = new LabColor(colorDegRight);
    cond.probeColorDegOffset = sample([-60, 60, -120, 120]);

    if (probeLeft) {
      cond.colorProbe = cond.colorLeft.getRelativeColor(cond.probeColorDegOffset);
      cond.colorProbeGrid = cond.colorLeft;
      cond.colorReference = cond.colorRight;
    } else {
      cond.colorProbe = cond.colorRight.getRelativeColor(cond.probeColorDegOffset);
      cond.colorProbeGrid = cond.colorRight;
      cond.colorReference = cond.colorLeft;
    }

    cond.rotationProbe = this.generateOrientation();
    cond.rotationReference = this.mirrorOrientation(cond.rotationProbe);

    const posLeft = this.generatePosition("left", [3, 5]);
    const posRight = this.generatePosition("right", [2, 4]);
    if (probeLeft) {
      cond.posProbe = posLeft;
      cond.posRef = posRight;
    } else {
      cond.posProbe = posRight;
      cond.posRef = posLeft;
    }

    cond.fixationTime = randomInt(30, 75) * 10;
    return cond;
  }
}

const conditionGenerator = new ConditionGenerator();

const leftKey = "q",
  rightKey = "p";

export async function run() {
  const jsPsych = initJsPsych();
  const timeline = [];

  const touchAdapterSpace = new TouchAdapter("space");
  const bindSpaceTouchAdapterToWindow = async () => {
    await delay(500); // Prevent touch event from previous touch
    touchAdapterSpace.bindToElement(window);
  };
  const unbindSpaceTouchAdapterFromWindow = () => {
    touchAdapterSpace.unbindFromElement(window);
  };

  // timeline.push({
  //   type: SurveyTextPlugin,
  //   questions: [{ prompt: "Please enter your subject number." }],
  //   data: {
  //     userAgent: navigator.userAgent,
  //   },
  // });

  // // Switch to fullscreen
  // timeline.push({
  //   type: FullscreenPlugin,
  //   fullscreen_mode: true,
  // });

  // // Instructions
  // timeline.push({
  //   type: HtmlKeyboardResponsePlugin,
  //   stimulus:
  //     "<p>Sie sehen gleich ein Muster aus farbigen Strichen.<br/>" +
  //     "Zwei sind etwas größer als die anderen und werden kurz blinken.<br/>" +
  //     "Bitte beurteilen Sie, welcher zuerst geblinkt hat.</p>" +
  //     "<p>War es der linke, drücken Sie die Taste <b>Q</b>.<br/>" +
  //     "Falls der rechte zuerst geblinkt hat, drücken Sie die Taste <b>P</b>.</p>" +
  //     "<p>Versuchen Sie, genau zu sein und keine Fehler zu machen. " +
  //     "Wenn Sie nicht wissen, wer zuerst war, raten Sie.</p>" +
  //     "<p>Press any key to start the experiment.</p>",
  //   on_start: bindSpaceTouchAdapterToWindow,
  //   on_finish: unbindSpaceTouchAdapterFromWindow,
  // });

  // Generate trials
  const factors = {
    probeLeft: [true, false],
    soa: [-10, -7, -5, -3, -1, 0, 1, 3, 5, 7, 10].map((x) => x * 10),
  };
  const repetitions = 2;
  let trials = jsPsych.randomization.factorial(factors, repetitions);

  const touchAdapterLeft = new TouchAdapter(leftKey);
  const touchAdapterRight = new TouchAdapter(rightKey);

  let scaler; // Will store the Scaler object for the TOJ plugin

  // Create TOJ plugin trial object
  const toj = {
    type: TojPlugin,
    modification_function: (element) => TojPlugin.flashElement(element, "toj-flash", 30),
    soa: jsPsych.timelineVariable("soa"),
    probe_key: () => (jsPsych.timelineVariable("probeLeft") ? leftKey : rightKey),
    reference_key: () => (jsPsych.timelineVariable("probeLeft") ? rightKey : leftKey),
    on_start: (trial) => {
      const probeLeft = jsPsych.timelineVariable("probeLeft");
      const cond = conditionGenerator.generateCondition(probeLeft);

      // Log probeLeft and condition
      trial.data = {
        probeLeft,
        condition: cond,
      };

      trial.fixation_time = cond.fixationTime;
    },
    on_load: () => {
      const trial = jsPsych.getCurrentTrial();
      const { condition: cond, probeLeft } = trial.data;

      const plugin = TojPlugin.current;

      const gridSize = [ConditionGenerator.gridSize, ConditionGenerator.gridSize];
      const targetScaleFactor = 1;
      const distractorScaleFactor = 0.7;
      const distractorScaleFactorSD = 0.1;

      const [probeGrid, probeTarget] = createBarStimulusGrid(
        gridSize,
        cond.posProbe,
        cond.colorProbe.toRgb(),
        cond.colorProbeGrid.toRgb(),
        targetScaleFactor,
        distractorScaleFactor,
        distractorScaleFactorSD,
        cond.rotationProbe
      );
      const [referenceGrid, referenceTarget] = createBarStimulusGrid(
        gridSize,
        cond.posRef,
        cond.colorReference.toRgb(),
        cond.colorReference.toRgb(),
        targetScaleFactor,
        distractorScaleFactor,
        distractorScaleFactorSD,
        cond.rotationReference
      );

      trial.probe_element = probeTarget;
      trial.reference_element = referenceTarget;
      trial.probe_touch_element = probeGrid;
      trial.reference_touch_element = referenceGrid;

      plugin.appendElement(probeGrid);
      plugin.appendElement(referenceGrid);
      setAbsolutePosition(probeGrid, (probeLeft ? -1 : 1) * 140);
      setAbsolutePosition(referenceGrid, (probeLeft ? 1 : -1) * 140);

      // Fit to window size
      scaler = new Scaler(
        plugin.container,
        ConditionGenerator.gridSize * 40 * 2,
        ConditionGenerator.gridSize * 40,
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
    timeline_variables: trials.slice(0, 10),
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
    type: HtmlKeyboardResponsePlugin,
    stimulus: "<p>You finished the tutorial.</p><p>Press any key to continue.</p>",
    on_start: bindSpaceTouchAdapterToWindow,
    on_finish: unbindSpaceTouchAdapterFromWindow,
  };

  const blockFinishedScreen = {
    type: HtmlKeyboardResponsePlugin,
    stimulus: () => {
      const block = jsPsych.timelineVariable("block");
      const blockCount = jsPsych.timelineVariable("blockCount");
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
    timeline_variables: Array.from(blockGenerator(5)),
  });

  await jsPsych.run(timeline);
  return jsPsych;
}
