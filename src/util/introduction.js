/**
 * Helper functions to add standard introductory jsPsych trials to a jsPsych timeline.
 */

// jsPsych plugins
import "jspsych/plugins/jspsych-html-button-response";
import "jspsych/plugins/jspsych-survey-text";
import "jspsych/plugins/jspsych-survey-multi-choice";
import "jspsych/plugins/jspsych-fullscreen";

import estimateVsync from "vsync-estimate";
import { customAlphabet } from "nanoid";
import marked from "marked";

marked.setOptions({ breaks: true });

/**
 * Adds introduction trials to a provided jsPsych timeline and returns an object that will be
 * populated with global properties set during the introduction trials (such as language choice and
 * participant code).
 *
 * The trials are:
 *  * A welcome page with radio buttons for first time participation and language selection, including vsync detection and user agent logging in the background
 *  * A declaration of consent page
 *  * A participation code announcement or input page
 *  * An age prompt
 *  * A gender prompt
 *  * A switch-to-fullscreen page
 *  * A tutorial page
 *
 * @param {any[]} timeline The jsPsych timeline to add the introduction trials to
 * @param {{
 *   skip?: boolean; // Whether or not to skip the introduction and use default properties; useful for development.
 *   experimentName: string;
 *   instructions: { // Markdown instruction strings
 *     de: string;
 *     en: string;
 *   }
 * }} options
 *
 * @returns {{
 *  instructionLanguage: "de"|"en";
 *  isFirstParticipation: boolean;,
 *  participantCode: string;
 * }}
 */
export function addIntroduction(timeline, options) {
  if (options.skip) {
    return {
      instructionLanguage: "en",
      isFirstParticipation: false,
      participantCode: "ABCD",
    };
  }

  const globalProps = {};

  timeline.push({
    type: "survey-multi-choice",
    preamble: `<p>Welcome to the ${options.experimentName} experiment!</p>`,
    questions: [
      {
        prompt: `Is this the first time you participate in this experiment?`,
        options: ["Yes", "No"],
        required: true,
      },
      {
        prompt: `Most parts of this experiment are available in multiple languages. Please select a language.`,
        options: ["Deutsch", "English"],
        required: true,
      },
    ],
    on_start: async (trial) => {
      const rate = await estimateVsync();
      trial.data.refreshRate = Math.round(rate);
    },
    on_finish: (trial) => {
      const responses = JSON.parse(trial.responses);
      const newProps = {
        isFirstParticipation: responses.Q0 === "Yes",
        instructionLanguage: responses.Q1 === "Deutsch" ? "de" : "en",
      };
      Object.assign(globalProps, newProps);
      jsPsych.data.addProperties(newProps);
    },
    data: {
      userAgent: navigator.userAgent,
    },
  });

  timeline.push({
    conditional_function: () => !globalProps.isFirstParticipation,
    timeline: [
      {
        type: "survey-text",
        questions: [
          {
            prompt:
              "<p>Please enter your participant code (the one you got the first time you participated in this experiment).</p>",
            required: true,
          },
        ],
        on_finish: (trial) => {
          const responses = JSON.parse(trial.responses);
          const newProps = {
            participantCode: responses.Q0,
          };
          Object.assign(globalProps, newProps);
          jsPsych.data.addProperties(newProps);
        },
      },
    ],
  });

  timeline.push({
    type: "html-button-response",
    stimulus: () => {
      return `<iframe class="declaration" src="media/misc/declaration_${globalProps.instructionLanguage}.html"></iframe>`;
    },
    choices: () => (globalProps.instructionLanguage === "en" ? ["I agree"] : ["Ich stimme zu"]),
  });

  // Participant code announcement / input
  timeline.push({
    conditional_function: () => globalProps.isFirstParticipation,
    timeline: [
      {
        type: "html-button-response",
        stimulus: () => {
          const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ123456789", 4);
          const participantCode = nanoid();
          const newProps = { participantCode };
          Object.assign(globalProps, newProps);
          jsPsych.data.addProperties(newProps);

          if (globalProps.instructionLanguage === "en") {
            return (
              `<p>Your participant code is <b>${participantCode}</b>.` +
              "</p><p><b>Important:</b> Please make sure to write it down somewhere. You will need it if you will do the second session or multiple sessions and for claiming your course credit!"
            );
          } else {
            return (
              `<p>Ihr Teilnahme-Code ist <b>${participantCode}</b>.` +
              "</p><p><b>Wichtig:</b> Bitte vergessen Sie nicht, sich Ihren Code aufzuschreiben! Sie benötigen ihn, um die zweite Sitzung und ggf. weitere Sitzungen zu machen und Ihre Versuchspersonenstunden gutgeschrieben zu bekommen!"
            );
          }
        },
        choices: () =>
          globalProps.instructionLanguage === "en"
            ? ["Done, let's continue"]
            : ["Ist gemacht, weiter!"],
      },
    ],
  });

  // Age prompt
  timeline.push({
    conditional_function: () => globalProps.isFirstParticipation,
    timeline: [
      {
        type: "survey-text",
        questions: [{ prompt: "Please enter your age.", required: true }],
      },
      {
        type: "survey-multi-choice",
        questions: [
          {
            prompt: "Please select your gender.",
            options: ["male", "female", "diverse"],
            required: true,
            horizontal: true,
          },
        ],
      },
    ],
  });

  // Switch to fullscreen
  timeline.push({
    type: "fullscreen",
    fullscreen_mode: true,
  });

  // Instructions
  timeline.push({
    type: "html-button-response",
    stimulus: () =>
      marked(
        globalProps.instructionLanguage === "en" ? options.instructions.en : options.instructions.de
      ),
    choices: () =>
      globalProps.instructionLanguage === "en"
        ? ["Got it, start the tutorial"]
        : ["Alles klar, Tutorial starten"],
  });

  return globalProps;
}
