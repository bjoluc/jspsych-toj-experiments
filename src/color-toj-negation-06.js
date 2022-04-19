/**
 * @title Color TOJ Negation 6
 * @description Experiment on negation in TVA instructions (dual-colored version, copy of experiment 3 (paper: 1b) with well-defined assertion/negation sequence lengths (formerly only random lengths) and fewer SOAs).
 * - Includes improvements:
 * - new declaration of consent, conforming DSGVO
 * - note about color vision deficiency + linking to a self-check
 * - instructions to turn screen into landscape mode
 * - instructions about deactivating blue light filters
 * - instructions about deactivating blue light dark mode
 * - Instructions to turn on sound and sound test (still to be done)
 * - Experiment after a pause is continued by pressing the space bar, not by pressing any key
 * @version 1.1.0
 * @imageDir images/common
 * @audioDir audio/color-toj-negation,audio/feedback
 * @miscDir misc
 */
//new: (above) changed title to "Negation 6"; TODO: description needs to be changed to describe neg6 instead of neg5

"use strict";

import "../styles/main.scss";

// jsPsych plugins
import "jspsych/plugins/jspsych-html-keyboard-response";
import "jspsych/plugins/jspsych-call-function";
import { TojPluginWhichFirst } from "./plugins/jspsych-toj-negation-which_first";
import tojPlugin from "./plugins/jspsych-toj-negation-which_first";
//old: removed imports that are not needed in neg6
//import tojNegationPlugin from "./plugins/jspsych-toj-negation-dual";
//import "./plugins/jspsych-toj-negation-dual";
//new: from neg02
//endNew: from neg02

import { generateAlternatingSequences, copy } from "./util/trialGenerator";

import delay from "delay";
import { sample } from "lodash";
import randomInt from "random-int";

import { TouchAdapter } from "./util/TouchAdapter";
import { Scaler } from "./util/Scaler";
import { createBarStimulusGrid } from "./util/barStimuli";
import { setAbsolutePosition } from "./util/positioning";
import { LabColor } from "./util/colors";
//old: removed Quadrant import because its not needed in neg6
//import { Quadrant } from "./util/Quadrant";
import { addIntroduction } from "./util/introduction";



const soaChoices = [-6, -3, -1, 0, 1, 3, 6].map((x) => (x * 16.6667).toFixed(3));
const soaChoicesTutorial = [-6, -3, 3, 6].map((x) => (x * 16.6667).toFixed(3));


const debugmode = false;

class TojTarget {
  /**
   * The target's color
   * @type {LabColor}
   */
  color;

  //new: from neg02
  /**
   * Whether the target is displayed on the left side of the screen
   * @type boolean
   */
  isLeft;
  //endNew: from neg02
  
  //old: removed quadrant because its not needed in neg6
  /**
   * The quadrant in which the target is displayed
   * @type {Quadrant}
   */
  //quadrant;

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
  //new: changed gridSize cause halfs instead of quadrants needed
  /**
   * The size ([x, y]) of the grid in one half
   */
  static gridSize = [7, 7];

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
    return new LabColor(sample([180]));
  }

 
  //new: from neg02
  generateCondition(probeLeft) {
    const alpha = ConditionGenerator.alpha;
    //diff to neg02: changed targets implementation to fit style of neg05
    let targets = {};

    // Generate a target pair
    const probe = new TojTarget();
    probe.isProbe = true;
    probe.isLeft = probeLeft;
    probe.color = ConditionGenerator.getRandomPrimaryColor();

    const reference = new TojTarget();
    reference.isProbe = false;
    reference.isLeft = !probeLeft;
    //diff to neg02: changed color value to 180 cause only red and green needed
    reference.color = probe.color.getRandomRelativeColor([180]);

    [probe, reference].map((target) => {
      const xRange = target.isLeft ? [3, 5] : [2, 4];
      target.gridPosition = ConditionGenerator.generateRandomPos(xRange, [2, 5]);
    });
    
    //diff to neg02: changed targets implementation to fit style of neg05
    targets = { probe, reference, fixationTime: randomInt(300, 500) };

    return {
      //diff to neg02: changed targets implementation to fit style of neg05
      targets,
      //diff to neg02: removed return of fixationTime because it is handled within "targets" now
      //fixationTime: randomInt(300, 500),
      rotation: this.generateOrientation(),
    };
  }
  //endNew: from neg02
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
    skip: true,
    //new: changed title to "Negaion 6"
    experimentName: "Color TOJ Negation 6",
    instructions: {
    //new: from neg02 (copied english and german instructions; edited text in first paragraph: changed colors to just red/rot and green/grün)
      en: `
You will see a grid of bars and a point in the middle. Please try to fixate the point during the whole experiment.
Two of the bars are colored (red or green).
At the beginning of each trial, you will hear an instruction like "now red" or "not green" (make sure to turn your sound on).
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
Zwei der Striche sind farbig (rot oder grün).
Am Anfang jedes Durchgangs hören Sie eine Anweisung wie "jetzt rot" oder "nicht grün" (denken Sie daran, den Ton einzuschalten).
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
      //endNew: from neg02
    },
  });

  // Generate trials
  const factors = {
    isInstructionNegated: [true, false],
    //probeLeft: [true, false],
    //new: from neg02
    probeLeft: [true, false],
    //endNew: from neg02
    
    soa: soaChoices,
    sequenceLength: [1, 2, 5],
  };
  const factorsTutorial = {
    isInstructionNegated: [true, false],
    //new: from neg02
    probeLeft: [true, false],
    //endNew: from neg02
    
    soa: soaChoicesTutorial,
    sequenceLength: [1, 2, 5],
  };
  const factorsDebug = {
    isInstructionNegated: [true, false],
    //new: from neg02
    probeLeft: [true, false],
    //endNew: from neg02
    
    soa: [-6, 6].map((x) => (x * 16.6667).toFixed(3)),
    sequenceLength: [1, 2],
  };
  const repetitions = 1;
  
  const blocksize = 40;
  const probeLeftIsFactor = true; // if true, it adds an implicit repetition
  const alwaysStayUnderBlockSize = false;
  let trialData = generateAlternatingSequences(
    factors,
    repetitions,
    probeLeftIsFactor,
    blocksize,
    alwaysStayUnderBlockSize
  );

  if (debugmode) {
    trialData = generateAlternatingSequences(factorsDebug, 1, false, 1, false);
  }
 
  let trials = trialData.trials;
  let blockCount = trialData.blockCount;

  const touchAdapterLeft = new TouchAdapter(
    jsPsych.pluginAPI.convertKeyCharacterToKeyCode(leftKey)
  );
  const touchAdapterRight = new TouchAdapter(
    jsPsych.pluginAPI.convertKeyCharacterToKeyCode(rightKey)
  );

  let scaler; // Will store the Scaler object for the TOJ plugin
  
  //new: from neg02
  // Create TOJ plugin trial object
  const toj = {
    type: "toj-which_first",
    modification_function: (element) => TojPluginWhichFirst.flashElement(element, "toj-flash", 30),
    soa: jsPsych.timelineVariable("soa"),
    //diff to neg02: changed probe_key and reference_key lines to fit neg05 implementation
    first_key: () => leftKey,
    second_key: () => rightKey,
    probe_key: () => "undefined",
    reference_key: () => "undefined",
    instruction_negated: jsPsych.timelineVariable("isInstructionNegated"),
    greenCalled: jsPsych.timelineVariable("GreenFact"),
    instruction_voice: () => sample(["m", "f"]),
    on_start: async (trial) => {
      // console.log(trial.soa)
      // console.log(trial.greenCalled ? "green called": "red called")
      // console.log((trial.greenCalled !== trial.instruction_negated) ? "green meant": "red meant")
      // console.log(trial.instruction_negated ? "instruction negated": "instruction not negated")
      // console.log((trial.soa <= 0  === (trial.greenCalled != trial.instruction_negated ))? leftKey : rightKey)
      const probeLeft = jsPsych.timelineVariable("probeLeft", true);
      const cond = conditionGenerator.generateCondition(probeLeft);
      
      //diff to neg02: added sequenceLength, rank, blockIndex, trialIndexInThisTimeline, trialIndexInThisBlock to fit neg05 implementation
      // Log probeLeft and condition
      trial.data = {
        probeLeft,
        condition: cond,
        sequenceLength: jsPsych.timelineVariable("sequenceLength", true),
        rank: jsPsych.timelineVariable("rank", true),
        blockIndex: jsPsych.timelineVariable("blockIndex", true),
        trialIndexInThisTimeline: jsPsych.timelineVariable("trialIndex", true),
        trialIndexInThisBlock: jsPsych.timelineVariable("trialIndexInBlock", true),
      };

      trial.fixation_time = cond.fixationTime;
      trial.instruction_language = globalProps.instructionLanguage;
      
      //diff to neg02: added gridColor here instead of globally
      const gridColor = "#777777";

      //trial.instruction_filename = (redInstruction
      //  ? cond.targets.reference
      //  : cond.targets.probe
      //).color.toName();



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
        tojPlugin.appendElement(gridElement);
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
      trial.instruction_filename = (trial.greenCalled
        ? cond.targets.probe
        : cond.targets.reference
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
    //diff to neg02: added optional debugmode and warm-up stopping from neg05
    on_finish: function (data) {
      scaler.destruct();
      touchAdapterLeft.unbindFromAll();
      touchAdapterRight.unbindFromAll();
      
      if (debugmode) {
        console.log(data);
      }
      if (!globalProps.isFirstParticipation) {
        if ((data["play_feedback"] === true) & (data["trialIndexInThisBlock"] >= 9)) {
          // do not continue after the 10th warm-up trial if participant is already familiar with the experiment
          jsPsych.endCurrentTimeline();
        }
      }
    },
  };
  //endNew: fromneg02

  const cursor_off = {
    type: "call-function",
    func: function () {
      document.body.style.cursor = "none";
    },
  };

  const cursor_on = {
    type: "call-function",
    func: function () {
      document.body.style.cursor = "auto";
    },
  };
  

  // Tutorial
  let trialDataTutorial = generateAlternatingSequences(factorsTutorial, 5, true); // generate trials with larger SOAs in tutorial

  trialDataTutorial.trials = trialDataTutorial.trials.map(trial => ({GreenFact:randomInt(0,1) === 1, ...trial}))

  let trialsTutorial = trialDataTutorial.trials.slice(0, debugmode ? 10 : 30);
  //let trialsTutorial = trials.slicetrials.slice(0, debugmode ? 10 : 30); // or duplicate trials that are actually used

  timeline.push(
    cursor_off,
    {
      timeline: [toj],
      timeline_variables: trialsTutorial,
      play_feedback: true,
    },
    cursor_on,
    {
      type: "html-keyboard-response",
      choices: [" "],
      stimulus: "<p>You finished the tutorial.</p><p>Press SPACE key or touch to continue.</p>",
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
    choices: () => {
      if (block < blockCount) {
        return [" "];
      } else {
        return jsPsych.ALL_KEYS;
      }
    },
    stimulus: () => {
      if (block < blockCount) {
        return `<h1>Pause</h1><p>You finished block ${block} of ${blockCount}.<p/><p>Press SPACE key or touch to continue.</p>`;
      } else {
        return "<p>This part of the experiment is finished. Press any key or touch to submit the results!</p>";
      }
    },
    on_start: bindSpaceTouchAdapterToWindow,
    on_finish: unbindSpaceTouchAdapterFromWindow,
  });
 
  
  let timelineVariablesBlock = [];
  let curBlockIndex = 0;

  if (debugmode) {
    trials = trials.slice(0, 16); // only relevant if the original factors are used, resulting in a very large cartesian product
    debugPrint(trials, factors);
  }

  timeline.push(cursor_off);

  for (let i = 0; i < trials.length; i++) {
    let trial = trials[i];
    trial.GreenFact = randomInt(0,1) === 1
    timelineVariablesBlock.push(trial);

    if (
      (i < trials.length - 1 && curBlockIndex < trials[i + 1]["blockIndex"]) ||
      i === trials.length - 1
    ) {
      /**
       * if (rather: when) block is full or the last trial in the list is reached:
       * - push trial collection as a block to timeline
       * - empty trial list
       * - set new current block index
       * - push block end screen to timeline
       */

      let timelineTrialsBlock = {
        timeline: [toj],
        timeline_variables: timelineVariablesBlock,
      };
      timeline.push(timelineTrialsBlock);
      timelineVariablesBlock = [];
      if (i !== trials.length - 1) {
        curBlockIndex = trials[i + 1]["blockIndex"];
      } else {
        /**
         * last full block might not be finished by the time the experiment ends, thus incrementing the block index manually. Theoretically getting the block index via trials[i + 1]["blockIndex"] - as done in the if condition - is not necessary and incrementing the index should be sufficient.
         */
        curBlockIndex++;
      }

      timeline.push(cursor_on);
      if (debugmode) {
        console.log("blockCount=" + blockCount);
      }
      timeline.push(makeBlockFinishedScreenTrial(curBlockIndex, blockCount));
      timeline.push(cursor_off);
    }
  }
  timeline.push(cursor_on);

  // Disable fullscreen
  timeline.push({
    type: "fullscreen",
    fullscreen_mode: false,
  });

  return timeline;
}

function debugPrint(trialVars, factors) {
  console.log("allTrials=");
  console.log(trialVars);

  let trialCount = 0;
  let curBlockIndex = 0;
  let currentBlockSize = 0;
  let sequenceLength = 0;
  let lastTrialIsNegated = trialVars[0].isInstructionNegated;

  let sequenceCount = {};
  factors.sequenceLength.forEach((seqLen) => {
    sequenceCount[seqLen] = 0;
  });

  let blockstring = "";
  trialVars.forEach((trial) => {
    if (trial.isInstructionNegated !== lastTrialIsNegated) {
      // instruction / utterance switched polarity
      // --> print sequence length
      blockstring += sequenceLength.toString();
      blockstring += lastTrialIsNegated ? "N " : "A ";

      sequenceCount[sequenceLength]++;

      lastTrialIsNegated = trial.isInstructionNegated;
      sequenceLength = 0;
    }

    if (curBlockIndex < trial["blockIndex"]) {
      console.log(blockstring);
      console.log("block_size=" + currentBlockSize + " block_index=" + curBlockIndex);
      currentBlockSize = 0;
      blockstring = "";

      curBlockIndex = trial["blockIndex"];
    }

    // sequence of negated/asserted statements is continued
    sequenceLength++;

    trialCount++;
    currentBlockSize++;
  });
  blockstring += sequenceLength.toString();
  blockstring += lastTrialIsNegated ? "N " : "A ";
  sequenceCount[sequenceLength]++;
  console.log(blockstring);
  console.log("block_size=" + currentBlockSize + " block_index=" + curBlockIndex);

  console.log("total_trials=" + trialCount);
  console.log("sequenceCount distinguished by sequenceLength:");
  console.log(sequenceCount);

  //SOA check: check how often SOAs were picked
  const asserted = 0;
  const negated = 1;
  let soas = [{}, {}];

  const createSoaTable = function (copyCount) {
    let map = {};
    factors.soa.forEach((key) => {
      map[key] = 0;
    });

    let res = [];
    for (let rank = 0; rank < copyCount; rank++) {
      res.push(copy(map));
    }
    return res;
  };

  // create 3-dimensional table to count used SOAs
  for (let i = 0; i < factors.sequenceLength.length; i++) {
    // use actual sequence length as key
    // for each utterance, sequence length and rank: add a list soas
    let seqLen = factors.sequenceLength[i]; // hier passieren sonderbare dinge
    soas[asserted][seqLen] = createSoaTable(seqLen);
    soas[negated][seqLen] = createSoaTable(seqLen);
  }

  trialVars.forEach((trial) => {
    let isNegated = trial.isInstructionNegated ? 1 : 0;
    soas[isNegated][trial.sequenceLength][trial.rank][trial.soa]++;
  });
  console.log(
    "soaCount, distinguished by asserted/negated, sequence length, rank of trial and SOA:"
  );
  console.log(soas);
}
