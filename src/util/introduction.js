/**
 * Helper functions to add standard introductory jsPsych trials to a jsPsych timeline.
 */

import SurveyMultiChoicePlugin from "@jspsych/plugin-survey-multi-choice";
import SurveyTextPlugin from "@jspsych/plugin-survey-text";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import FullscreenPlugin from "@jspsych/plugin-fullscreen";

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
 * @param {import("jspsych").JsPsych} jsPsych The jsPsych instance of the experiment
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
export function addIntroduction(jsPsych, timeline, options) {
  if (options.skip) {
    return {
      instructionLanguage: "en",
      isFirstParticipation: false,
      participantCode: "ABCD",
    };
  }

  const globalProps = {};

  timeline.push({
    type: SurveyMultiChoicePlugin,
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
      const newProps = {
        isFirstParticipation: trial.response.Q0 === "Yes",
        instructionLanguage: trial.response.Q1 === "Deutsch" ? "de" : "en",
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
        type: SurveyTextPlugin,
        questions: [
          {
            prompt:
              "<p>Please enter your participant code (the one you got the first time you participated in this experiment).</p>",
            required: true,
          },
        ],
        on_finish: (trial) => {
          const newProps = {
            participantCode: trial.response.Q0,
          };
          jsPsych.data.addProperties(newProps);
        },
      },
    ],
  });

  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: () => {
      return `<iframe class="declaration" src="media/misc/declaration_${globalProps.instructionLanguage}.html"></iframe>`;
    },
    choices: () => (globalProps.instructionLanguage === "en" ? ["I agree"] : ["Ich stimme zu"]),
  });

  // Instructions to prepare computer
  // Disable any color temperature changeing software / settings
  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: () => {
      return `<iframe class="technical-instruction" src="media/misc/technical_instructions_color_temperature_${globalProps.instructionLanguage}.html"></iframe>`;
    },
    choices: () => (globalProps.instructionLanguage === "en" ? ["Done"] : ["Habe ich getan"]),
  });

  // Disable dark reader
  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: () => {
      return `<iframe class="technical-instruction" src="media/misc/technical_instructions_dark_reader_${globalProps.instructionLanguage}.html"></iframe>`;
    },
    choices: () =>
      globalProps.instructionLanguage === "en"
        ? ["Dark mode is inactive"]
        : ["Dark mode ist abgeschaltet"],
  });

  // Color vision test
  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: () => {
      return `<iframe class="technical-instruction" src="media/misc/technical_instructions_color_vision_${globalProps.instructionLanguage}.html"></iframe>`;
    },
    choices: () =>
      globalProps.instructionLanguage === "en"
        ? ["I do not have color vision deficiencies"]
        : ["Ich habe keine Farbsehschwäche"],
  });

  // Turn on sound
  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: () => {
      return `<iframe class="technical-instruction" src="media/misc/technical_instructions_sound_${globalProps.instructionLanguage}.html"></iframe>`;
    },
    choices: () =>
      globalProps.instructionLanguage === "en"
        ? ["Computer sounds are enabled"]
        : ["Der Ton ist eingeschaltet"],
  });

  // Participant code announcement / input
  timeline.push({
    conditional_function: () => globalProps.isFirstParticipation,
    timeline: [
      {
        type: HtmlButtonResponsePlugin,
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
        type: SurveyTextPlugin,
        questions: [{ prompt: "Please enter your age.", required: true }],
      },
      {
        type: SurveyMultiChoicePlugin,
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
    type: FullscreenPlugin,
    fullscreen_mode: true,
  });

  // Instructions
  timeline.push({
    type: HtmlButtonResponsePlugin,
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
