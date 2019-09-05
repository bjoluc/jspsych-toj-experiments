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

## Getting started
