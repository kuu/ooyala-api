const debug = require('debug');
const utils = require('../utils');

const print = debug('oo');

function printToken(api, params, argv) {
  if (params.length === 0) {
    utils.THROW(new Error('Embed code is not specified.'));
  }
  const embedCode = params.join(',');
  print(`token: embedCode='${embedCode}' accountId='${argv.accountId}'`);
  console.log(api.getTokenRequest(embedCode, argv.accountId));
}

module.exports = printToken;
