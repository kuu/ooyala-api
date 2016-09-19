#!/usr/bin/env node
const URL = require('url');
const minimist = require('minimist');
const debug = require('debug');
const config = require('config');
const pkg = require('./package.json');
const OoyalaApi = require('./lib');

const print = debug('oo');
const argv = minimist(process.argv.slice(2));
const HELP_TEXT = `
Usage:
    oo [options] command [parameters]

Example:
    oo -v
    oo token --embedCode xxxx
    oo token --embedCode xxxx,yyyy --accountId david1203
    oo sign --url /hoge?foo=bar
    oo sign --url /hoge?foo=bar --body '{"data": {"comment": "This is JSON"}}'
    oo sign --url /hoge?foo=bar --body '{"data": {"comment": "This is JSON"}}' --method PATCH

Options:
  -h, --help    Print help
  -v, --version Print version

Commands:
  token           Generates Ooyala player token (OPT) request URL. Parameters: embedCode, [accountId]
  sign            Generates signature based on given params (method, url, body)

Parameters:
  embedCode     Content id or a comma-separated list of content ids
  accountId     Viewer's login id
  method        (GET | POST | PUT | DELETE | PATCH) default = GET
  url           URL string (relative url)
  body          Body string
`;

const CONFIG_HELP_TEXT = `
Please put config file(s) in your work directory.
 $ mkdir config
 $ vi config/default.json
 {
   "api": {
     "key":        {Your Ooyala API Key},
     "secret":     {Your Ooyala API Secret},
     "period":     {The period during which the api request is valid (in seconds. default=86400)}
   }
 }
`;

const VERSION = `v${pkg.version}`;

if (!config.api) {
  console.info(CONFIG_HELP_TEXT);
} else if (argv.h || argv.help) {
  console.info(HELP_TEXT);
} else if (argv.v || argv.version) {
  console.info(VERSION);
} else {
  const command = argv._[0];
  const api = new OoyalaApi(config.api.key, config.api.secret, {expirationTime: config.api.period});
  switch (command) {
    case 'token':
      if (argv.embedCode) {
        print(`token: embedCode='${argv.embedCode}' accountId='${argv.accountId}'`);
        console.log(api.getTokenRequest(argv.embedCode, argv.accountId));
      } else {
        console.info(HELP_TEXT);
      }
      break;
    case 'sign':
      if (argv.url) {
        const {method, path, params, body} = parseSignArgs(argv);
        print(`sign: method='${method}' path='${path}' params='${JSON.stringify(params)}' method='${method}' body='${body}'`);
        console.log(api.sign(method, path, params, body));
      } else {
        console.info(HELP_TEXT);
      }
      break;
    default:
      console.info(HELP_TEXT);
  }
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
