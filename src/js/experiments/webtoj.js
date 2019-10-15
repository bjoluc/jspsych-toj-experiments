import "jspsych/plugins/jspsych-html-keyboard-response";
import "jspsych/plugins/jspsych-fullscreen";
import "../plugins/jspsych-toj-image";

export function createTimeline(jatosStudyInput = null) {
  let timeline = [];

  console.log(jatosStudyInput);

  // Welcome screen
  timeline.push({
    type: "html-keyboard-response",
    stimulus:
      "<p>Thank you for taking the time to participate in WebTOJ!<p/>" +
      "<p>Press any key to begin.</p>",
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
      "<p>Some handy instruction text.</p>" + "<p>Press any key to start the experiment.</p>",
  });

  // Generate trials
  let factors = {
    probe_image: ["images/gray.png"],
    reference_image: ["images/gray.png"],
    soa: [-10, -8, -5, -3, -2, -1, 0, 1, 2, 3, 5, 8, 10].map(x => x * 10),
  };
  let repetitions = 2;
  let trials = jsPsych.randomization.factorial(factors, repetitions);

  // Create toj-image trial object
  let toj = {
    type: "toj-image",
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

  return timeline;
}

export function getPreloadImagePaths() {
  return [];
}
