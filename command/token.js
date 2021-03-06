const debug = require('debug');
const utils = require('../utils');

const print = debug('oo');

function getToken(api, params, argv) {
  if (params.length === 0) {
    utils.THROW(new Error('Embed code is not specified.'));
  }
  const embedCode = params.join(',');
  print(`token: embedCode='${embedCode}' expiration=${argv.expiration} accountId='${argv.accountId}'`);
  return Promise.resolve(api.getTokenRequest(embedCode, argv.accountId));
}

module.exports = getToken;
