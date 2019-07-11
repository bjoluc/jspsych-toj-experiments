/**
 * A jsPsych plugin for temporal order judgement tasks
 * 
 * @author bjoluc
 * @version 1.0.0
 * @license MIT
 */

jsPsych.plugins['temporal-order-judgement'] = (function() {

    var plugin = {};
  
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
            probe_image_properties: {
                type: jsPsych.plugins.parameterType.OBJECT,
                pretty_name: 'Probe image properties',
                default: undefined,
                description: '(optional) An object containing optional image properties. Allowed property keys are: `height`, `width`, and `css`.'
            },
            reference_image_properties: {
                type: jsPsych.plugins.parameterType.OBJECT,
                pretty_name: 'Reference image properties',
                default: undefined,
                description: '(optional) An object containing optional image properties. Allowed property keys are: `height`, `width`, and `css`.'
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
                description: 'The key that the subject uses to select the'
            },
            reference_key: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                pretty_name: 'Reference key',
                default: undefined,
                description: 'The key that the subject uses to select the reference'
            }
        }
    }
  
    plugin.trial = function(display_element, trial) {
        // Create container div
        var container = document.createElement("div");
        container.id = 'jspsych-temporal-order-judgement-container';
        container.innerHTML = trial.fixation_mark_html;
        display_element.appendChild(container);
        
        // Function to create hidden stimulus image elements
        var createStimulusImageElement = function(container, imageSrc, cssClass, imageProperties) {
            var imagePropertiesDefined = typeof imageProperties != 'undefined';

            var image = document.createElement("img");
            
            if(imagePropertiesDefined && imageProperties.hasOwnProperty('css')) {
                image.style = imageProperties['css'];
            }
            
            image.style.visibility = 'hidden';
            image.className = cssClass;
            image.src = imageSrc

            if(imagePropertiesDefined) {
                if (imageProperties.hasOwnProperty('width')) {
                    image.setAttribute('width', imageProperties['width']);
                };
                if (imageProperties.hasOwnProperty('height')) {
                    image.setAttribute('height', imageProperties['height']);
                };
            }

            container.appendChild(image);
            return image;
        }

        // Create stimulus image elements
        probe = createStimulusImageElement(container, trial.probe_image, 'toj-probe', trial.probe_image_properties);
        reference = createStimulusImageElement(container, trial.reference_image, 'toj-reference', trial.reference_image_properties);

        // Function for showing an element, optionally after a specified time
        var showElement = function(element, timeout) {
            var show = function() {
                element.style.visibility = 'visible';
            }
            if (typeof timeout === 'undefined' || timeout === 0) {
                show()
            } else {
                jsPsych.pluginAPI.setTimeout(show, timeout);
            }
        }

        // Show images according to SOA
        if (trial.soa < 0) {
            showElement(probe)
            showElement(reference, -trial.soa)
        } else {
            showElement(reference)
            showElement(probe, trial.soa)
        }

        // Variable for keyboard response
        var keyboardResponse = {
            rt: null,
            key: null
        };

        // Function to handle subject responses
        var on_response = function(info) {

            // Only react to the first response
            if (keyboardResponse.key != null) return;
            keyboardResponse = info;

            // kill any remaining setTimeout handlers
            // jsPsych.pluginAPI.clearAllTimeouts();

            // Clear the screen
            display_element.innerHTML = '';

            // Process the response
            var responseKey = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(keyboardResponse.key);
            var response = null;
            switch(responseKey) {
                case trial.probe_key:
                    response = 'probe';
                    break;
                case trial.reference_key:
                    response = 'reference';
                    break;
            }

            var correct = (trial.soa <= 0 && response == 'probe') || (trial.soa >= 0 && response == 'reference');

            // Finish trial and log data
            jsPsych.finishTrial({
                probe_image:      trial.probe_image,
                reference_image:  trial.reference_image,
                soa:              trial.soa,
                response_key:     responseKey,
                response:         response,
                response_correct: correct,
                rt:               keyboardResponse.rt
            });
        };

        // Start the response listener
        var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: on_response,
            valid_responses: [trial.probe_key, trial.reference_key],
            rt_method: 'performance',
            persist: false,
            allow_held_key: false
        });
    }
  
    return plugin;
})();
