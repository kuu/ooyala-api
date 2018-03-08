#!/usr/bin/env node
const minimist = require('minimist');
const config = require('config');
const constants = require('./constants');
const execute = require('./execute');

const argv = minimist(process.argv.slice(2));

if (!config.api) {
  console.info(constants.CONFIG_HELP_TEXT);
} else if (argv.h || argv.help) {
  console.info(constants.HELP_TEXT);
} else if (argv.v || argv.version) {
  console.info(constants.VERSION);
} else {
  execute(config.api, argv, constants)
    .then(result => {
      console.log(result);
    }).catch(err => {
      console.error(`${err.message} ${err.stack}`);
      console.info(constants.HELP_TEXT);
    });
}
