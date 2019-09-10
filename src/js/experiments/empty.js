import "jspsych/plugins/jspsych-html-keyboard-response";
import "jspsych/plugins/jspsych-fullscreen";

/**
 * Creates the experiment's jsPsych timeline.
 *
 * Make sure to import every jsPsych plugin you use (at the top of this file).
 *
 * @param {any} jatosStudyInput When served by JATOS, this is the object defined by the JATOS JSON
 * study input.
 */
export function createTimeline(jatosStudyInput = null) {
  // Initialize timeline
  let timeline = [];

  // Welcome screen
  timeline.push({
    type: "html-keyboard-response",
    stimulus: "<p>Welcome to another experiment!<p/>" + "<p>Press any key to begin.</p>",
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

  // Add your trials here

  return timeline;
}

export function getPreloadImagePaths() {
  return [];
}
