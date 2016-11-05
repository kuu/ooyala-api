const URL = require('url');
const debug = require('debug');
const utils = require('../utils');

const print = debug('oo');

function printSignature(api, url, argv) {
  if (!url) {
    utils.THROW(new Error('URL is not specified.'));
  }
  argv.url = url;
  const {method, path, params, body} = parseSignArgs(argv);
  print(`sign: method='${method}' path='${path}' params='${JSON.stringify(params)}' method='${method}' body='${body}'`);
  console.log(api.sign(method, path, params, body));
}

function parseSignArgs({method, url, body}) {
  const {pathname, query} = URL.parse(url, true);
  const bodyStr = parseBody(body);

  if (!method) {
    method = bodyStr ? 'POST' : 'GET';
  }
  return {method, path: pathname, params: query, body: bodyStr};
}

function parseBody(body) {
  if (!body) {
    return '';
  }
  if (typeof body === 'object') {
    try {
      return JSON.stringify(body);
    } catch (err) {
      return '';
    }
  }
  return String(body);
}

module.exports = printSignature;
