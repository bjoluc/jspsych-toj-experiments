# jsPsych Boilerplate

A boilerplate to quickly build [jsPsych](https://www.jspsych.org/) experiments
and package them for [JATOS](https://www.jatos.org/)

## Motivation

[jsPsych](https://www.jspsych.org/) is a great JavaScript library for the
creation of browser-based psychological experiments.
[JATOS](https://www.jatos.org/) is a server application that can make
browser-based experiments available to subjects via the internet and collect the
results via an API.

While setting up jsPsych experiments for JATOS is certainly possible with only a
text editor and a file manager, there are a few redundant steps that have to be
done for every experiment. Some of these are:

* Downloading and extracting jsPsych
* Setting up an index.html file
* Adding JATOS API calls to the experiment script to save the results to JATOS
* Uploading the resulting .html, .js, .css, and image files to a JATOS server
* Configuring a JATOS experiment that uses the files

Additionally, you would have to think about JavaScript and CSS browser
compatibility: Which features can you use such that the experiment is compatible
with all browsers?

jsPsych Boilerplate comes to the rescue and automates pretty much all of these
steps with common web development tools. In the end, you get a JATOS experiment
zip file which you can upload via the JATOS web user interface.

## Requirements

This project requires [Node.js](https://nodejs.org) 10.x.x to be installed on your machine.

## Getting started

1. Clone the repository and install the dependencies with npm
    ```bash
    $ git clone https://github.com/bjoluc/jspsych-boilerplate.git
    $ cd jspsych-boilerplate
    $ npm install
    ```

2. Configure a new experiment
   1. Duplicate [src/meta/empty.yml](src/meta/empty.yml) and rename it to your
      experiment's name. This file is where the metadata (title and description)
      of your new experiment are configured.
   2. Replace the METAFILE value in [config.yml](config.yml) with your filename
      from the previous step, so the build script knows which meta file to read.
   3. Duplicate [src/js/experiments/empty.js](src/js/experiments/empty.js) and
      rename it to your experiment's name. This is where you will write your
      jsPsych experiment.
   4. In the first line of [src/js/app.js](src/js/app.js), modify the right
      handside of the import statement to import your experiment.

3. Run ```npm run start```. This will build your experiment and watch the source
   files for changes. Whenever you modify a source file, the build will be
   modified too. You should now have an `index.html` file within your `dist`
   folder. Open it with a browser and you will see your new jsPsych experiment in action!

4. If you are new to jsPsych, you might have a look at the jsPsych [demo
   experiment
   tutorial](https://www.jspsych.org/tutorials/rt-task/#part-2-display-welcome-message).
   You can skip part 1 there, as jspsych-boilerplate has you covered.

Once you have finished writing your experiment, you can run ```npm run
package```. This will create a JATOS study zip file of your experiment within
the `packaged` directory.
