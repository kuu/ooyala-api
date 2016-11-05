const debug = require('debug');
const utils = require('../utils');

const print = debug('oo');

function printToken(api, embedCode, argv) {
  if (!embedCode) {
    utils.THROW(new Error('Embed code is not specified.'));
  }
  print(`token: embedCode='${embedCode}' accountId='${argv.accountId}'`);
  console.log(api.getTokenRequest(embedCode, argv.accountId));
}

module.exports = printToken;
