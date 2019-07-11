"use strict";

import plugins from "gulp-load-plugins";
import gulp from "gulp";
import yargs from "yargs";
import rimraf from "rimraf";
import fs from "fs";
import yaml from "js-yaml";
import webpackStream from "webpack-stream";
import webpack2 from "webpack";
import named from "vinyl-named";
import log from "fancy-log";
import colors from "ansi-colors";

// Load all Gulp plugins into one variable
const $ = plugins();

// Check for --production flag
const PRODUCTION = !!yargs.argv.production;

// Check for --development flag unminified with sourcemaps
const DEV = !!yargs.argv.dev;

// Load settings from settings.yml
const { REVISIONING, PATHS } = loadConfig();

// Load YML config file
function loadConfig() {
  log("Loading", colors.bold(colors.cyan("config.yml")), "...");
  let ymlFile = fs.readFileSync("config.yml", "utf8");
  return yaml.load(ymlFile);
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

function html() {
  return gulp.src("src/html/**/*").pipe(gulp.dest(PATHS.dist));
}

// Compile Sass into CSS
// In production, the CSS is compressed
function sass() {
  return gulp
    .src(["src/scss/app.scss"])
    .pipe(
      $.sass({
        includePaths: PATHS.sass
      }).on("error", $.sass.logError)
    )
    .pipe($.autoprefixer())
    .pipe($.if(PRODUCTION, $.cleanCss({ compatibility: "ie9" })))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe($.if((REVISIONING && PRODUCTION) || (REVISIONING && DEV), $.rev()))
    .pipe(gulp.dest(PATHS.dist + "/css"))
    .pipe(
      $.if(
        (REVISIONING && PRODUCTION) || (REVISIONING && DEV),
        $.rev.manifest()
      )
    )
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
          exclude: /node_modules(?![\\\/]jspsych)/
        }
      ]
    },
    mode: PRODUCTION ? "production" : "development"
  },

  changeHandler(err, stats) {
    log(
      "[webpack]",
      stats.toString({
        colors: true
      })
    );
  },

  build() {
    return gulp
      .src(PATHS.entries)
      .pipe(named())
      .pipe(webpackStream(webpack.config))
      .pipe(
        $.if(
          PRODUCTION,
          $.uglify().on("error", e => {
            console.log(e);
          })
        )
      )
      .pipe($.if((REVISIONING && PRODUCTION) || (REVISIONING && DEV), $.rev()))
      .pipe(gulp.dest(PATHS.dist + "/js"))
      .pipe(
        $.if(
          (REVISIONING && PRODUCTION) || (REVISIONING && DEV),
          $.rev.manifest()
        )
      )
      .pipe(gulp.dest(PATHS.dist + "/js"));
  },

  watch() {
    const watchConfig = Object.assign(webpack.config, {
      watch: true,
      devtool: "inline-source-map"
    });

    return gulp
      .src(PATHS.entries)
      .pipe(named())
      .pipe(
        webpackStream(watchConfig, webpack2, webpack.changeHandler).on(
          "error",
          err => {
            log(
              "[webpack:error]",
              err.toString({
                colors: true
              })
            );
          }
        )
      )
      .pipe(gulp.dest(PATHS.dist + "/js"));
  }
};

gulp.task("webpack:build", webpack.build);
gulp.task("webpack:watch", webpack.watch);

function externaljs() {
  return gulp
    .src(PATHS.externaljs)
    .pipe($.sourcemaps.init())
    .pipe($.uglify())
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(PATHS.dist + "/js"));
}

function externalcss() {
  return gulp.src(PATHS.externalcss).pipe(gulp.dest(PATHS.dist + "/css"));
}

function watch() {
  gulp.watch(PATHS.assets, copy);
  gulp.watch("src/html/**/*", html);
  gulp
    .watch("src/scss/**/*.scss", sass)
    .on("change", path =>
      log("File " + colors.bold(colors.magenta(path)) + " changed.")
    )
    .on("unlink", path =>
      log("File " + colors.bold(colors.magenta(path)) + " was removed.")
    );
}

gulp.task(
  "build",
  gulp.series(
    clean,
    gulp.parallel(copy, html, sass, "webpack:build", externaljs, externalcss)
  )
);

// Default task: Copy files, compile sass and watch for changes
gulp.task(
  "default",
  gulp.series("build", gulp.parallel(watch, "webpack:watch"))
);
