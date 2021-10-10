/**
 * @title Web TOJ
 * @description Example TOJ Experiment
 * @version 2.0.0
 *
 * @imageDir images/common,images/webtoj
 */

"use strict";

import "../styles/main.scss";

import { initJsPsych } from "jspsych";
import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";

import TojPlugin from "./plugins/TojPlugin";
import ImageTojPlugin from "./plugins/ImageTojPlugin";

export async function run() {
  const jsPsych = initJsPsych();
  const timeline = [];

  // Welcome screen
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus:
      "<p>Thank you for taking the time to participate in WebTOJ!<p/>" +
      "<p>Press any key to begin.</p>",
  });

  // Switch to fullscreen
  timeline.push({
    type: FullscreenPlugin,
    fullscreen_mode: true,
  });

  // Instructions
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus:
      "<p>Some handy instruction text.</p>" + "<p>Press any key to start the experiment.</p>",
  });

  // Generate trials
  const factors = {
    probe_image: ["media/images/webtoj/gray.png"],
    reference_image: ["media/images/webtoj/gray.png"],
    soa: [-10, -8, -5, -3, -2, -1, 0, 1, 2, 3, 5, 8, 10].map((x) => x * 10),
  };
  const repetitions = 1;
  const trials = jsPsych.randomization.factorial(factors, repetitions);

  // Create toj-image trial object
  const toj = {
    type: ImageTojPlugin,
    hide_stimuli: false,
    modification_function: (element) => TojPlugin.flashElement(element, "toj-flash", 30),
    probe_image: jsPsych.timelineVariable("probe_image"),
    reference_image: jsPsych.timelineVariable("reference_image"),
    soa: jsPsych.timelineVariable("soa"),
    probe_properties: {
      width: 100,
      height: 100,
      x: -200,
    },
    reference_properties: {
      width: 100,
      height: 100,
      x: 200,
    },
    probe_key: "tab",
    reference_key: "enter",
  };

  timeline.push({
    timeline: [toj],
    timeline_variables: trials,
  });

  await jsPsych.run(timeline);
  return jsPsych;
}
