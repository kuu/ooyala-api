const pkg = require('./package.json');

const VERSION = `v${pkg.version}`;

const HELP_TEXT = `
Usage:
    oo [options] command [parameters]

Example:
    oo -v
    oo token embed_code
    oo token embed_code1 embed_code2 --accountId david1203
    oo sign /hoge?foo=bar
    oo sign /hoge?foo=bar --body '{"data": {"comment": "This is JSON"}}'
    oo sign /hoge?foo=bar --body '{"data": {"comment": "This is JSON"}}' --method PATCH
    oo upload ./path/to/file --title "My video"
    oo upload ./path/to/file1 ./path/to/file2 --title "My videos" --chunkSize 1024

Options:
    -h, --help    Print help
    -v, --version Print version

Commands:
    token           Generates Ooyala player token (OPT) request URL.
    sign            Generates signature based on given params.
    upload          Uploads file(s).

Syntax:
    token           embed-code(s) [accountId]
    sign            url [method body]
    upload          local-file-path(s) [title chunkSize] (if multiple files are specified, the title is suffixed by '- part n')

Optional parameters:
    accountId     Viewer's login id (default = undefined)
    method        (GET | POST | PUT | DELETE | PATCH) default = GET
    body          Body string (default = '')
    title         Title of the video (default = {file name})
    chunkSize     Byte size of each chunk (default = 204800)
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

module.exports = {
  VERSION,
  HELP_TEXT,
  CONFIG_HELP_TEXT
};
