import { createTimeline, getPreloadImagePaths } from "./experiments/quick-toj";

if (typeof jatos != "undefined") {
  // Experiment is served by JATOS
  jatos.onLoad(function() {
    jsPsych.init({
      timeline: createTimeline(jatos.studyJsonInput),
      preload_images: getPreloadImagePaths(),
      on_finish: function() {
        var results = jsPsych.data.get().json();
        jatos.submitResultData(results, jatos.startNextComponent);
      },
    });
  });
} else {
  // Experiment is run locally
  jsPsych.init({
    timeline: createTimeline(null),
    preload_images: getPreloadImagePaths(),
    on_finish: function() {
      jsPsych.data.displayData();
    },
  });
}
