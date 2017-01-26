[![NPM version](https://badge.fury.io/js/ooyala-api.png)](https://badge.fury.io/js/ooyala-api)
[![Build Status](https://travis-ci.org/kuu/ooyala-api.svg?branch=master)](https://travis-ci.org/kuu/ooyala-api)
[![Coverage Status](https://coveralls.io/repos/kuu/ooyala-api/badge.png?branch=master)](https://coveralls.io/r/kuu/ooyala-api?branch=master)
[![Dependency Status](https://gemnasium.com/kuu/ooyala-api.png)](https://gemnasium.com/kuu/ooyala-api)

# ooyala-api

Ooyala API client library and CLI for Node.js

## Install
[![NPM](https://nodei.co/npm/ooyala-api.png?mini=true)](https://nodei.co/npm/ooyala-api/)

## API
```js
const OoyalaApi = require('ooyala-api');

const api = new OoyalaApi('Your Ooyala API Key', 'Your Ooyala API Secret', {concurrency: 6});
const embedCode = 'Content ID';

// GET
api.get(`/v2/assets/${embedCode}`)
.then((body) => {
  // JSON object
})
.catch((err) => {
  // Error response
});

// GET (with params + pagination)
api.get('/v2/assets', {where: `labels+INCLUDES+'Music'`}, {recursive: true})
.then((items) => {
  // All items in an array (recursive calls will be done internally)
})
.catch((err) => {
  // Error response
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
}).then((body) => {});

// DELETE
api.delete(`/v2/assets/${embedCode}`).then((body) => {});
```

### `options`
| API         | Option Name    | Type    | Default | Meaning                                  |
| ----------- | -------------- |:-------:|:-------:| :----------------------------------------|
| constructor | subdomain      | String | "api"   | Will be used to construct the destination server's host name. (default=api.ooyala.com) |
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
     "key":        "Your Ooyala API Key",
     "secret":     "Your Ooyala API Secret"
   }
 }
```

```
Usage:
    oo [options] command [parameters]

Options:
  -h, --help    Print help
  -v, --version Print version

Commands:
  token           Generates Ooyala player token (OPT) request URL.
  sign            Generates a signature based on given params.
  upload          Uploads file(s).
  remote          Creates a remote asset

Syntax:
  oo token embed-code(s) [accountId]
  oo sign url [method body]
  oo upload local-file-path(s) [title chunkSize profile]
  oo remote asset-name [dash hls hds]

Example:
  oo -v
  oo token embed_code
  oo token embed_code1 embed_code2 --accountId david1203
  oo sign /hoge?foo=bar
  oo sign /hoge?foo=bar --body '{"data": {"comment": "This is JSON"}}'
  oo sign /hoge?foo=bar --body '{"data": {"comment": "This is JSON"}}' --method PATCH
  oo upload ./path/to/file --title "My video"
  oo upload ./path/to/files/*.mp4 --title "My videos" --chunkSize 1024 --profile abc
  oo remote "My remote asset" --dash http://x.jp/a.mpd --hls http://x.jp/a.m3u8 --hds http://x.jp/a.f4m

Parameters:
  accountId     Viewer's login id (default = undefined)
  method        (GET | POST | PUT | DELETE | PATCH) default = GET
  body          Body string (default = '')
  title         Title of the video (default = {file name} if multiple files are specified, the title is suffixed by '- part n')
  chunkSize     Byte size of each chunk (default = 204800)
  profile       Profile id used for encoding
  dash          Remote asset URL for MPEG-DASH
  hls           Remote asset URL for HTTP Live Streaming
  hds           Remote asset URL for HTTP Dynamic Streaming

```
