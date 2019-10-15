// jsPsych plugins
import "jspsych/plugins/jspsych-html-keyboard-response";
import "jspsych/plugins/jspsych-survey-text";
import "jspsych/plugins/jspsych-fullscreen";
import tojPlugin from "../plugins/jspsych-toj-image";
import { TojPlugin } from "../plugins/jspsych-toj";

import { TouchAdapter } from "../util/TouchAdapter";
import { Scaler } from "../util/Scaler";
import randomInt from "random-int";
import delay from "delay";

class ConditionGenerator {
  static fieldWidth = 320;
  static gridWidth = 8;
  static gridSize = ConditionGenerator.fieldWidth / ConditionGenerator.gridWidth;

  previousOrientations = {};
  previousPositions = {};

  generateOrientation(identifier) {
    let orientation = randomInt(0, 17);
    while (orientation == this.previousOrientations[identifier]) {
      orientation = randomInt(0, 17);
    }
    this.previousOrientations[identifier] = orientation;
    return orientation;
  }

  mirrorOrientation(orientation) {
    return (orientation + 9) % 18;
  }

  static _generateRandomPos(xRange, yRange) {
    return [
      randomInt(...xRange) * ConditionGenerator.gridSize,
      randomInt(...yRange) * ConditionGenerator.gridSize,
    ];
  }

  generatePosition(identifier, xRange = [2, 5], yRange = [2, 5]) {
    let pos = ConditionGenerator._generateRandomPos(xRange, yRange);
    while (pos == this.previousPositions[identifier]) {
      pos = ConditionGenerator._generateRandomPos(xRange, yRange);
    }
    this.previousPositions[identifier] = pos;
    return pos;
  }

  generateCondition(probeLeft, salient) {
    let cond = {};
    cond.oriLeft = this.generateOrientation("left");
    cond.oriRight = this.mirrorOrientation(cond.oriLeft);
    if (probeLeft) {
      cond.oriProbe = salient ? cond.oriRight : cond.oriLeft;
      cond.oriRef = cond.oriRight;
    } else {
      cond.oriProbe = salient ? cond.oriLeft : cond.oriRight;
      cond.oriRef = cond.oriLeft;
    }

    cond.posLeft = this.generatePosition("left", [3, 5]);
    cond.posRight = this.generatePosition("right", [2, 4]);

    if (probeLeft) {
      cond.posProbe = cond.posLeft;
      cond.posRef = cond.posRight;
    } else {
      cond.posProbe = cond.posRight;
      cond.posRef = cond.posLeft;
    }

    // Create image paths
    cond.bgImageLeft = `images/quick-toj/background_${cond.oriLeft}.png`;
    cond.bgImageRight = `images/quick-toj/background_${cond.oriRight}.png`;
    cond.probeImage = `images/quick-toj/target_${cond.oriProbe}.png`;
    cond.refImage = `images/quick-toj/target_${cond.oriRef}.png`;

    // Set background image options
    const bgDimensions = {
      width: ConditionGenerator.fieldWidth,
      height: ConditionGenerator.fieldWidth,
    };

    const bgOffset = ConditionGenerator.fieldWidth / 2;
    cond.bgImageLeftProperties = {
      ...bgDimensions,
      x: -bgOffset,
    };
    cond.bgImageRightProperties = {
      ...bgDimensions,
      x: bgOffset,
    };

    // Set stimulus image options
    const stimulusDimensions = {
      width: ConditionGenerator.gridSize,
      height: ConditionGenerator.gridSize,
    };

    let probeOffsetX, refOffsetX;
    probeOffsetX = refOffsetX = ConditionGenerator.gridSize / 2 - 1;
    if (probeLeft) {
      probeOffsetX -= ConditionGenerator.fieldWidth;
    } else {
      refOffsetX -= ConditionGenerator.fieldWidth;
    }
    let offsetY = -ConditionGenerator.fieldWidth / 2 + ConditionGenerator.gridSize / 2 - 1;

    cond.probeImageProperties = {
      ...stimulusDimensions,
      x: cond.posProbe[0] + probeOffsetX,
      y: cond.posProbe[1] + offsetY,
    };
    cond.refImageProperties = {
      ...stimulusDimensions,
      x: cond.posRef[0] + refOffsetX,
      y: cond.posRef[1] + offsetY,
    };

    cond.preDelay = randomInt(30, 75) * 10;
    return cond;
  }
}

const conditionGenerator = new ConditionGenerator();

const leftKey = "q",
  rightKey = "p";

export function createTimeline(jatosStudyInput = null) {
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

  // Welcome screen
  timeline.push({
    type: "html-keyboard-response",
    stimulus:
      "<p><img src='images/quick-toj/logo.png' style='max-width: 100vh;'></img><p/>" +
      "<p>Thank you for taking the time to participate in QuickTOJ Web!<p/>" +
      "<p>Press any key to begin.</p>",
    on_load: bindSpaceTouchAdapterToWindow,
    on_finish: unbindSpaceTouchAdapterFromWindow,
  });

  timeline.push({
    type: "survey-text",
    questions: [{ prompt: "Please enter your subject number." }],
    data: {
      userAgent: navigator.userAgent,
    },
  });

  // Switch to fullscreen
  timeline.push({
    type: "fullscreen",
    fullscreen_mode: true,
  });

  // Instructions
  timeline.push({
    type: "html-keyboard-response",
    stimulus:
      "<p>Sie sehen gleich ein Muster aus grauen Strichen.<br/>" +
      "Zwei sind etwas dunkler grau und werden kurz blinken.<br/>" +
      "Bitte beurteilen Sie, welcher zuerst geblinkt hat.</p>" +
      "<p>War es der linke, drücken Sie die Taste <b>Q</b>.<br/>" +
      "Falls der rechte zuerst geblinkt hat, drücken Sie die Taste <b>P</b>.</p>" +
      "<p>Versuchen Sie, genau zu sein und keine Fehler zu machen. " +
      "Wenn Sie nicht wissen, wer zuerst war, raten Sie.</p>" +
      "<p>Press any key to start the experiment.</p>",
    on_load: bindSpaceTouchAdapterToWindow,
    on_finish: unbindSpaceTouchAdapterFromWindow,
  });

  // Generate trials
  const factors = {
    probeLeft: [true, false],
    salient: [true, false],
    soa: [-10, -7, -5, -3, -1, 0, 1, 3, 5, 7, 10].map(x => x * 10),
  };
  const repetitions = 1;
  let trials = jsPsych.randomization.factorial(factors, repetitions);

  trials.forEach((trial, index, trials) => {
    const condition = conditionGenerator.generateCondition(trial.probeLeft, trial.salient);
    trials[index] = Object.assign({}, trial, condition);
  });

  const touchAdapterLeft = new TouchAdapter(
    jsPsych.pluginAPI.convertKeyCharacterToKeyCode(leftKey)
  );
  const touchAdapterRight = new TouchAdapter(
    jsPsych.pluginAPI.convertKeyCharacterToKeyCode(rightKey)
  );

  let scaler; // Will store the Scaler object for the TOJ plugin

  // Create TOJ plugin trial object
  const toj = {
    type: "toj-image",
    modification_function: element => TojPlugin.flashElement(element, "toj-flash", 30),
    hide_stimuli: false,
    probe_image: jsPsych.timelineVariable("probeImage"),
    reference_image: jsPsych.timelineVariable("refImage"),
    fixation_time: jsPsych.timelineVariable("preDelay"),
    soa: jsPsych.timelineVariable("soa"),
    probe_properties: jsPsych.timelineVariable("probeImageProperties"),
    reference_properties: jsPsych.timelineVariable("refImageProperties"),
    probe_key: () => (jsPsych.timelineVariable("probeLeft", true) ? leftKey : rightKey),
    reference_key: () => (jsPsych.timelineVariable("probeLeft", true) ? rightKey : leftKey),
    on_load: () => {
      const bgImageLeft = tojPlugin.addBackgroundImage(
        jsPsych.timelineVariable("bgImageLeft", true),
        jsPsych.timelineVariable("bgImageLeftProperties", true)
      );
      touchAdapterLeft.bindToElement(bgImageLeft);
      touchAdapterLeft.bindByClass(
        jsPsych.timelineVariable("probeLeft", true) ? "toj-probe" : "toj-reference"
      );
      const bgImageRight = tojPlugin.addBackgroundImage(
        jsPsych.timelineVariable("bgImageRight", true),
        jsPsych.timelineVariable("bgImageRightProperties", true)
      );
      touchAdapterRight.bindToElement(bgImageRight);
      touchAdapterRight.bindByClass(
        jsPsych.timelineVariable("probeLeft", true) ? "toj-reference" : "toj-probe"
      );
      // Fit to window size
      scaler = new Scaler(
        document.getElementById("jspsych-toj-container"),
        ConditionGenerator.fieldWidth * 2,
        ConditionGenerator.fieldWidth,
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
  const blockGenerator = function*(blockCount) {
    let currentBlock = 1;
    while (currentBlock <= blockCount) {
      yield { block: currentBlock, blockCount };
      currentBlock += 1;
    }
  };

  const tutorialFinishedScreen = {
    type: "html-keyboard-response",
    stimulus: "<p>You finished the tutorial.</p><p>Press any key to continue.</p>",
    on_load: bindSpaceTouchAdapterToWindow,
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
    on_load: bindSpaceTouchAdapterToWindow,
    on_finish: unbindSpaceTouchAdapterFromWindow,
  };

  // Add tutorial to main timeline
  timeline.push(tutorialTojTimeline, tutorialFinishedScreen);

  // Add experiment blocks to main timeline
  timeline.push({
    timeline: [experimentTojTimeline, blockFinishedScreen],
    timeline_variables: Array.from(blockGenerator(5)),
  });

  return timeline;
}

function* pathGenerator(prefix, fromNumber, toNumber, suffix) {
  for (let i = fromNumber; i <= toNumber; i++) {
    yield prefix + i + suffix;
  }
}

export function getPreloadImagePaths() {
  const root = "images/quick-toj/";
  let paths = [root + "logo.png"];
  paths = paths.concat(Array.from(pathGenerator(root + "background_", 0, 17, ".png")));
  paths = paths.concat(Array.from(pathGenerator(root + "target_", 0, 17, ".png")));
  return paths;
}
