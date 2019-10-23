"use strict";

import plugins from "gulp-load-plugins";
import gulp from "gulp";
import yargs from "yargs";
import rimraf from "rimraf";
import fs from "fs";
import dateFormat from "dateformat";
import yaml from "js-yaml";
import webpackStream from "webpack-stream";
import webpack2 from "webpack";
import named from "vinyl-named";
import log from "fancy-log";
import colors from "ansi-colors";
import uuidv4 from "uuid/v4";
import slugify from "slugify";

// Load all Gulp plugins into one variable
const $ = plugins();

// Check for --production flag
const PRODUCTION = !!yargs.argv.production;

// Check for --development flag
const DEV = !!yargs.argv.dev;

// Function to load a YAML config file
function loadYmlFile(filename) {
  log("Loading", colors.bold(colors.cyan(filename)), "...");
  let ymlFile = fs.readFileSync(filename, "utf8");
  return yaml.load(ymlFile);
}

// Load settings from settings.yml
const { METAFILE, REVISIONING, PATHS } = loadYmlFile("config.yml");
const REV = REVISIONING && (PRODUCTION || DEV);

const META = loadYmlFile("src/meta/" + METAFILE);

// Auto-generate a slug if no slug is specified
if (META.slug == null) {
  META.slug = slugify(META.title, {
    lower: true,
    replacement: "_",
    remove: /"<>#%\{\}\|\\\^~\[\]`;\?:@=&/g,
  });
}

sass.compiler = require("node-sass");

function clean(done) {
  rimraf(PATHS.dist, done);
}

// Copy files out of the assets folder
// This task skips over the "images", "js", and "scss" folders, which are parsed separately
function copy() {
  return gulp.src(PATHS.assets).pipe(gulp.dest(PATHS.dist));
}

const html = {
  _build(includeJatos) {
    let htmlReplacements = {
      title: {
        src: META.title,
        tpl: "<title>%s</title>",
      },
    };

    if (includeJatos) {
      htmlReplacements.jatosjs = "/assets/javascripts/jatos.js";
    }

    return gulp
      .src("src/html/**/*")
      .pipe($.htmlReplace(htmlReplacements))
      .pipe(
        $.inject(gulp.src(PATHS.dist + "/css/**/*"), {
          addRootSlash: false,
          ignorePath: "dist",
        })
      )
      .pipe($.removeEmptyLines({ removeComments: true }))
      .pipe(gulp.dest(PATHS.dist));
  },

  local() {
    return html._build(false);
  },

  jatos() {
    return html._build(true);
  },
};

// Compile Sass into CSS
// In production, the CSS is compressed
function sass() {
  return gulp
    .src(["src/scss/app.scss"])
    .pipe(
      $.sass({
        includePaths: PATHS.sass,
      }).on("error", $.sass.logError)
    )
    .pipe($.autoprefixer())
    .pipe($.if(PRODUCTION, $.cleanCss({ compatibility: "ie9" })))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe($.if(REV, $.rev()))
    .pipe(gulp.dest(PATHS.dist + "/css"))
    .pipe($.if(REV, $.rev.manifest()))
    .pipe(gulp.dest(PATHS.dist + "/css"));
}

// Combine JavaScript into one file
// In production, the file is minified
const webpack = {
  config: {
    module: {
      rules: [
        {
          test: /.js$/,
          loader: "babel-loader",
          exclude: /node_modules(?![\\\/]jspsych)/,
        },
      ],
    },
    mode: PRODUCTION ? "production" : "development",
    optimization: PRODUCTION ? { minimize: true } : {},
  },

  changeHandler(err, stats) {
    log(
      "[webpack]",
      stats.toString({
        colors: true,
      })
    );
  },

  build() {
    return gulp
      .src(PATHS.entries)
      .pipe(named())
      .pipe(webpackStream(webpack.config, webpack2))
      .pipe($.if(REV, $.rev()))
      .pipe(gulp.dest(PATHS.dist + "/js"))
      .pipe($.if(REV, $.rev.manifest()))
      .pipe(gulp.dest(PATHS.dist + "/js"));
  },

  watch() {
    const watchConfig = Object.assign(webpack.config, {
      watch: true,
      devtool: "inline-source-map",
    });

    return gulp
      .src(PATHS.entries)
      .pipe(named())
      .pipe(
        webpackStream(watchConfig, webpack2, webpack.changeHandler).on("error", err => {
          log(
            "[webpack:error]",
            err.toString({
              colors: true,
            })
          );
        })
      )
      .pipe(gulp.dest(PATHS.dist + "/js"));
  },
};

function externaljs() {
  return gulp
    .src(PATHS.externaljs)
    .pipe($.if(!PRODUCTION, $.sourcemaps.init()))
    .pipe($.uglify())
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest(PATHS.dist + "/js"));
}

function externalcss() {
  return gulp
    .src(PATHS.externalcss)
    .pipe($.if(PRODUCTION, $.cleanCss({ compatibility: "ie9" })))
    .pipe(gulp.dest(PATHS.dist + "/css"));
}

function watch() {
  gulp.watch(PATHS.assets, copy);
  gulp.watch("src/html/**/*", html.local);
  gulp
    .watch("src/scss/**/*.scss", sass)
    .on("change", path => log("File " + colors.bold(colors.magenta(path)) + " changed."))
    .on("unlink", path => log("File " + colors.bold(colors.magenta(path)) + " was removed."));
}

function getJatosStudyDescription() {
  let study = {
    version: "3",
    data: {
      uuid: uuidv4(),
      title: META.title,
      description: META.jatosDescription,
      groupStudy: false,
      dirName: META.slug,
      comments: "",
      jsonData: JSON.stringify(META.jatosJsonInput),
      componentList: [
        {
          uuid: uuidv4(),
          title: "Experiment",
          htmlFilePath: "index.html",
          reloadable: true,
          active: true,
          comments: "",
          jsonData: "",
        },
      ],
      batchList: [
        {
          uuid: uuidv4(),
          title: "Default",
          active: true,
          maxActiveMembers: null,
          maxTotalMembers: null,
          maxTotalWorkers: null,
          allowedWorkerTypes: null,
          comments: null,
          jsonData: "",
        },
      ],
    },
  };
  return study;
}

// Create a .zip archive for JATOS import
function archive() {
  let time = dateFormat(new Date(), "yyyy-mm-dd_HH-MM-ss");
  let title = META.slug + "_" + time + ".zip";
  let jatosStudyJsonString = JSON.stringify(getJatosStudyDescription());

  return gulp
    .src(PATHS.dist + "/**/*")
    .pipe(
      $.rename(function(file) {
        file.dirname = META.slug + "/" + file.dirname;
      })
    )
    .pipe($.file(META.slug + ".jas", jatosStudyJsonString))
    .pipe($.zip(title))
    .pipe(gulp.dest("packaged"));
}

exports.build = gulp.series(
  clean,
  gulp.parallel(
    copy,
    sass,
    externaljs,
    externalcss,
    webpack.build,
    gulp.series(sass, externalcss, html.local)
  )
);

exports.package = gulp.series(
  clean,
  gulp.parallel(
    copy,
    sass,
    externaljs,
    externalcss,
    webpack.build,
    gulp.series(sass, externalcss, html.jatos)
  ),
  archive
);

// Default task: Build and watch for changes
exports.default = gulp.series(exports.build, gulp.parallel(watch, webpack.watch));
