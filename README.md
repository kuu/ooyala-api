[![NPM version](https://badge.fury.io/js/ooyala-api.png)](https://badge.fury.io/js/ooyala-api)
[![Build Status](https://travis-ci.org/kuu/ooyala-api.svg?branch=master)](https://travis-ci.org/kuu/ooyala-api)
[![Dependency Status](https://gemnasium.com/kuu/ooyala-api.png)](https://gemnasium.com/kuu/ooyala-api)

# ooyala-api

Ooyala API client library and CLI for Node.js

## Install
[![NPM](https://nodei.co/npm/ooyala-api.png?mini=true)](https://nodei.co/npm/ooyala-api/)

## API
```js
const OoyalaApi = require('ooyala-api');

const api = new OoyalaApi('{Your Ooyala API Key}', '{Your Ooyala API Secret}', {concurrency: 6});
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

### `options`
| API         | Option Name    | Type    | Default | Meaning                                  |
| ----------- | -------------- |:-------:|:-------:| :----------------------------------------|
| constructor | secure         | Boolean | false   | If true, the library sends https request |
| constructor | expirationTime | Integer | 86400   | TTL of the API call in seconds           |
| constructor | concurrency    | Integer | 5       | Limits the number of concurrent API calls. The valid range is 1~10 |
| get         | recursive      | Boolean | false   | If true, the library calls API recursively as long as  `next_page` is specified in the response |
| get, post, put, delete, patch | headers      | Object | undefined   | If the object contains HTTP headers, the key-value pairs are used for the request. |
| get, post, put, delete, patch | requestURL      | String | undefined   | If defined, the url is just used. No params are added internally. |

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

Currently, only three commands (`token`, `sign`, and `upload`) are supported.
```
Usage:
    oo [options] command [parameters]

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

Example:
  oo -v
  oo token embed_code
  oo token embed_code1 embed_code2 --accountId david1203
  oo sign /hoge?foo=bar
  oo sign /hoge?foo=bar --body {"data": {"comment": "This is JSON"}}
  oo sign /hoge?foo=bar --body {"data": {"comment": "This is JSON"}} --method PATCH
  oo upload ./path/to/file --title "My video"
  oo upload ./path/to/file1 ./path/to/file2 --title "My videos" --chunkSize 1024
```
