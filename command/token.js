const debug = require('debug');
const constants = require('../constants');

const print = debug('oo');

function printToken(api, embedCode, argv) {
  if (embedCode) {
    print(`token: embedCode='${embedCode}' accountId='${argv.accountId}'`);
    console.log(api.getTokenRequest(embedCode, argv.accountId));
  } else {
    console.info(constants.HELP_TEXT);
  }
}

module.exports = printToken;
