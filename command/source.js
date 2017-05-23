const debug = require('debug');
const utils = require('../utils');

const print = debug('oo');

function downloadSourceFile(api, params) {
  if (params.length === 0) {
    utils.THROW(new Error('Embed code is not specified.'));
  }

  const embedCode = params[0];

  print(`downloadSourceFile(${embedCode})`);

  return api.get(`/v2/assets/${embedCode}/source_file_info`)
  .then(result => {
    if (!result.source_file_url) {
      utils.THROW(new Error('Failed to get source_file_url.'));
    }
    print(`source_file_url: ${result.source_file_url}`);
    return api.get(null, {}, {requestURL: result.source_file_url, writeStream: process.stdout});
  });
}

module.exports = downloadSourceFile;
