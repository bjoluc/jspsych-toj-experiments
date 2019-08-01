import { createTimeline } from "./experiments/webtoj";

if (typeof jatos != "undefined") {
  // Experiment is served by JATOS
  jatos.onLoad(function() {
    jsPsych.init({
      timeline: createTimeline(jatos.studyJsonInput),
      on_finish: function() {
        var results = jsPsych.data.get().json();
        jatos.submitResultData(results, jatos.startNextComponent);
      }
    });
  });
} else {
  // Experiment is run locally
  jsPsych.init({
    timeline: createTimeline(null),
    on_finish: function() {
      jsPsych.data.displayData();
    }
  });
}
