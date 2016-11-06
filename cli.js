#!/usr/bin/env node
const minimist = require('minimist');
const config = require('config');
const OoyalaApi = require('./lib');
const constants = require('./constants');

const argv = minimist(process.argv.slice(2));

if (!config.api) {
  console.info(constants.CONFIG_HELP_TEXT);
} else if (argv.h || argv.help) {
  console.info(constants.HELP_TEXT);
} else if (argv.v || argv.version) {
  console.info(constants.VERSION);
} else {
  const api = new OoyalaApi(config.api.key, config.api.secret, {expirationTime: config.api.period, concurrency: 6});
  try {
    require(`./command/${argv._[0]}`)(api, argv._.slice(1), argv)
    .then(result => {
      console.log(result);
    });
  } catch (err) {
    console.error(`${err.message} ${err.stack}`);
    console.info(constants.HELP_TEXT);
  }
}
