/**
 * A jsPsych plugin for temporal order judgement tasks
 * 
 * @author bjoluc
 * @version 1.0.0
 * @license MIT
 */

"use strict";

// async function support
import "core-js/stable"; 
import "regenerator-runtime/runtime";

function Sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

jsPsych.plugins['temporal-order-judgement'] = (function() {

    let plugin = {};
  
    plugin.info = {
        name: 'temporal-order-judgement',
        parameters: {
            probe_image: {
                type: jsPsych.plugins.parameterType.IMAGE,
                pretty_name: 'TOJ Probe image',
                default: undefined,
                description: 'The image to be used as the TOJ probe'
            },
            reference_image: {
                type: jsPsych.plugins.parameterType.IMAGE,
                pretty_name: 'TOJ Reference image',
                default: undefined,
                description: 'The image to be used as the TOJ reference'
            },
            probe_properties: {
                type: jsPsych.plugins.parameterType.OBJECT,
                pretty_name: 'Probe image properties',
                default: {},
                description: '(optional) An object containing optional image properties. Allowed property keys are: `height`, `width`, `x`, `y`, and `css`.'
            },
            reference_properties: {
                type: jsPsych.plugins.parameterType.OBJECT,
                pretty_name: 'Reference image properties',
                default: {},
                description: '(optional) An object containing optional image properties. Allowed property keys are: `height`, `width`, `x`, `y`, and `css`.'
            },
            fixation_mark_html: {
                type: jsPsych.plugins.parameterType.HTML_STRING,
                pretty_name: 'Fixation mark HTML code',
                default: "<div class='toj-fixation-mark'>+</div>",
                description: 'The HTML code of the fixation mark'
            },
            fixation_time: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Fixation time',
                default: 800,
                description: '(optional) The length of the time in which only the fixation mark is shown on the screen'
            },
            soa: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Stimulus onset asynchrony (SOA)',
                default: undefined,
                description: 'The image to be used as the TOJ reference'
            },
            probe_key: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                pretty_name: 'Probe key',
                default: undefined,
                description: 'The key that the subject uses to select the probe'
            },
            reference_key: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                pretty_name: 'Reference key',
                default: undefined,
                description: 'The key that the subject uses to select the reference'
            }
        }
    }
  
    plugin.trial = async function(display_element, trial) {
        // Create container div
        let container = document.createElement("div");
        container.id = 'jspsych-temporal-order-judgement-container';
        container.innerHTML = trial.fixation_mark_html;
        display_element.appendChild(container);
        
        // Function to create hidden stimulus image elements
        let createStimulusImageElement = function(container, imageSrc, cssClass, imageProperties) {
            let imagePropertiesDefined = typeof imageProperties != 'undefined';

            let image = document.createElement("img");
            
            if(imagePropertiesDefined && imageProperties.hasOwnProperty('css')) {
                image.style = imageProperties['css'];
            }
            
            image.style.visibility = 'hidden';
            image.className = cssClass;
            image.src = imageSrc;

            if(imagePropertiesDefined) {
                if (imageProperties.hasOwnProperty('width')) {
                    image.setAttribute('width', imageProperties['width']);
                };
                if (imageProperties.hasOwnProperty('height')) {
                    image.setAttribute('height', imageProperties['height']);
                };
                if (imageProperties.hasOwnProperty('x')) {
                    image.style.marginLeft = imageProperties['x'] + "px";
                };
                if (imageProperties.hasOwnProperty('y')) {
                    image.style.marginTop = imageProperties['y'] + "px";
                };
            }

            container.appendChild(image);
            return image;
        }

        // Create stimulus image elements
        let probe = createStimulusImageElement(container, trial.probe_image, 'toj-probe', trial.probe_properties);
        let reference = createStimulusImageElement(container, trial.reference_image, 'toj-reference', trial.reference_properties);

        // Function for showing an element
        let showElement = function(element) {
            element.style.visibility = 'visible';
        }

        await Sleep(trial.fixation_time);

        // Show images according to SOA
        if (trial.soa < 0) {
            showElement(probe);
            await Sleep(-trial.soa);
            showElement(reference);
        } else {
            showElement(reference)
            if (trial.soa != 0) {
                await Sleep(trial.soa);
            }
            showElement(probe);
        }

        // Variable for keyboard response
        let keyboardResponse = {
            rt: null,
            key: null
        };

        // Function to handle subject responses
        let on_response = function(info) {

            // Only react to the first response
            if (keyboardResponse.key != null) return;
            keyboardResponse = info;

            // kill any remaining setTimeout handlers
            // jsPsych.pluginAPI.clearAllTimeouts();

            // Clear the screen
            display_element.innerHTML = '';

            // Process the response
            let responseKey = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(keyboardResponse.key);
            let response = null;
            switch(responseKey) {
                case trial.probe_key:
                    response = 'probe';
                    break;
                case trial.reference_key:
                    response = 'reference';
                    break;
            }

            let correct = (trial.soa <= 0 && response == 'probe') || (trial.soa >= 0 && response == 'reference');

            // Finish trial and log data
            jsPsych.finishTrial({
                probe_image:          trial.probe_image,
                reference_image:      trial.reference_image,
                probe_properties:     trial.probe_properties,
                reference_properties: trial.reference_properties,
                soa:                  trial.soa,
                response_key:         responseKey,
                response:             response,
                response_correct:     correct,
                rt:                   keyboardResponse.rt
            });
        };

        // Start the response listener
        let keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: on_response,
            valid_responses: [trial.probe_key, trial.reference_key],
            rt_method: 'performance',
            persist: false,
            allow_held_key: false
        });
    }
  
    return plugin;
})();
