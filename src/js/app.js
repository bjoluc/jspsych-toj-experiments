import "jspsych/plugins/jspsych-html-keyboard-response"
import "jspsych/plugins/jspsych-fullscreen"
import "./jspsych-temporal-order-judgement"

var timeline = [];

var welcome = {
    type: "html-keyboard-response",
    stimulus: "<p>Thank you for taking the time to participate in WebTOJ!<p/>" +
        "<p>Press any key to begin.</p>"
};
timeline.push(welcome);

timeline.push({
    type: 'fullscreen',
    fullscreen_mode: true
});

var instructions = {
    type: "html-keyboard-response",
    stimulus: "<p>In this experiment, a circle will appear in the center " +
        "of the screen.</p><p>If the circle is <strong>blue</strong>, " +
        "press the letter F on the keyboard as fast as you can.</p>" +
        "<p>If the circle is <strong>orange</strong>, press the letter J " +
        "as fast as you can.</p>" +
        "<div style='width: 700px;'>"+
        "<div style='float: left;'><img src='images/blue.png'></img>" +
        "<p class='small'><strong>Press the F key</strong></p></div>" +
        "<div class='float: right;'><img src='images/orange.png'></img>" +
        "<p class='small'><strong>Press the J key</strong></p></div>" +
        "</div>"+
        "<p>Press any key to begin.</p>",
    post_trial_gap: 2000
};
timeline.push(instructions);


var trial_conditions = [
    {
        probe_image: "images/blue.png",
        reference_image: "images/orange.png",
        soa: 300
    },
];

var fixation = {
    type: 'html-keyboard-response',
    stimulus: '<div style="font-size:30px;">+</div>',
    choices: jsPsych.NO_KEYS,
    trial_duration: function(){
        return jsPsych.randomization.sampleWithoutReplacement([250, 500, 750, 1000, 1250, 1500, 1750, 2000], 1)[0];
    }
}

var toj = {
    type:            "temporal-order-judgement",
    probe_image:     jsPsych.timelineVariable('probe_image'),
    reference_image: jsPsych.timelineVariable('reference_image'),
    soa:             jsPsych.timelineVariable('soa'),
    probe_key:       'tab',
    reference_key:   'enter',
}

var trial_procedure = {
    timeline: [fixation, toj],
    timeline_variables: trial_conditions,
    randomize_order: true, // order of the timeline variables
    repetitions: 2
}

timeline.push(trial_procedure);

jsPsych.init({
    timeline: timeline,
    on_finish: function() {
        jsPsych.data.displayData();
    }
});