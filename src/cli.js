import yargs from 'yargs';
import config from 'config';
import OoyalaApi from 'ooyala-api';

const argv = yargs.argv;
const HELP_TEXT = `
Usage:
    oo [options] command [parameters]

Example:
    oo -v
    oo token --embedCode xxxx
    oo token --embedCode xxxx,yyyy --accountId david1203

Options:
  -h, --help    Print help
  -v, --version Print version

Commands:
  token           Generates Ooyala player token (OPT) request URL. Parameters: embedCode, [accountId]

Parameters:
  embedCode     Content id or a comma-separated list of content ids
  accountId     Viewer's login id
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
   },
   "debug":        {Whether to print logs, true/false}
 }
`;

let pkg;

try {
  pkg = require('./package.json');
} catch (e) {
  // Being executed locally
  pkg = require('../package.json');
}

const VERSION = `v${pkg.version}`;

if (!config.api) {
  console.info(CONFIG_HELP_TEXT);
} else if (argv.h || argv.help) {
  console.info(HELP_TEXT);
} else if (argv.v || argv.version) {
  console.info(VERSION);
} else {
  const command = argv._[0];
  const api = new OoyalaApi(config.api.key, config.api.secret, {expirationTime: config.api.period, log: config.debug});
  switch (command) {
  case 'token':
    if (argv.embedCode) {
      console.log(api.getTokenRequest(argv.embedCode, argv.accountId, argv.method));
    } else {
      console.info(HELP_TEXT);
    }
    break;
  }
}
