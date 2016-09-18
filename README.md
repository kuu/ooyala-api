# ooyala-api

`ooyala-api` is available as an [npm package](https://www.npmjs.com/package/ooyala-api).

## Install
```
$ cd /Your/Project/Directory
$ npm install --save ooyala-api
```

## API
```js
const OoyalaApi = require('ooyala-api');

const api = new OoyalaApi('Your Ooyala API Key', 'Your Ooyala API Secret', {log: true});
const embedCode = 'Content ID';

// GET
api.get(`/v2/assets/${embedCode}`)
.then((body) => {
  // JSON object
  console.log(body);
});

// GET (with params + pagination)
api.get('/v2/assets', {where: `labels+INCLUDES+'Music'`}, {recursive: true})
.then((items) => {
  // All items in an array (recursive calls will be done internally)
  console.log(items);
});

// POST
api.post('/v2/assets', {}, {
  name: `test ${Date()}`,
  asset_type: 'remote_asset',
  is_live_stream: true,
  stream_urls: {
    'flash': FLASH_URL,
    'iphone': IPHONE_URL
  }
}).then((result) => {
  console.log(result);
});

// DELETE
api.delete(`/v2/assets/${embedCode}`)
.then((result) => {
  console.log(result);
});
```

## CLI
Please put config file(s) in your work directory.
```js
 $ mkdir config
 $ vi config/default.json
 {
   "api": {
     "key":        {Your Ooyala API Key},
     "secret":     {Your Ooyala API Secret},
     "period":     {The period during which the api request is valid (in seconds. default=86400)}
   }
 }
```

Currently, only two commands (`token` and `sign`) are supported.
```
Usage:
    oo [options] command [parameters]

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

Example:
  oo -v
  oo token --embedCode xxxx
  oo token --embedCode xxxx,yyyy --accountId david1203
  oo sign --url /hoge?foo=bar
  oo sign --url /hoge?foo=bar --body {"data": {"comment": "This is JSON"}}
  oo sign --url /hoge?foo=bar --body {"data": {"comment": "This is JSON"}} --method PATCH
```
