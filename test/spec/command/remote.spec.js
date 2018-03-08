const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const fakeEmbedCode = 'xxx';
const dummyFetch = {
  // fetch(url, params) {
  fetch() {
    // console.log(`[dummyFetch] url=${url}, params=${params}`);
    return Promise.resolve({
      status: 200,
      statusText: 'OK',
      headers: {
        get(h) {
          const header = h.toLowerCase();
          if (header === 'content-type') {
            return 'application/json';
          }
          return null;
        }
      },
      body: {
        dataHandler: null,
        on: bodyOn
      }
    });
  },

  results: [{embed_code: fakeEmbedCode}, {}]
};

function bodyOn(type, handler) {
  if (type === 'data') {
    this.dataHandler = handler;
  } else if (type === 'end') {
    process.nextTick(() => {
      this.dataHandler(Buffer.from(JSON.stringify(dummyFetch.results.shift())));
      handler();
    });
  }
  return {dataHandler: this.dataHandler, on: bodyOn};
}

// Override dependencies
const mockFetch = sinon.spy(dummyFetch, 'fetch');
const OoyalaApi = proxyquire('../../../lib', {'node-fetch': mockFetch});
const remote = require('../../../command/remote');

const API_KEY = '123456';
const API_SECRET = 'abcdef';
const api = new OoyalaApi(API_KEY, API_SECRET);

// oo remote "My remote asset" http://x.jp/a.m3u8
test.cb('remote', t => {
  const assetName = 'My remote asset';
  const dashURL = 'http://x.jp/a.mpd';
  const hlsURL = 'http://x.jp/a.m3u8';
  const hdsURL = 'http://x.jp/a.f4m';
  const params = [assetName, hdsURL];
  const argv = {dash: dashURL, hls: hlsURL, hds: hdsURL};
  const requestURLs = [
    'http://api.ooyala.com/v2/assets',
    `http://api.ooyala.com/v2/assets/${fakeEmbedCode}/movie_urls`
  ];
  const method = 'POST';
  const bodys = [
    {
      name: assetName,
      asset_type: 'remote_asset',
      is_live_stream: true,
      stream_urls: {flash: hdsURL, iphone: hlsURL}
    },
    {
      dash: dashURL,
      hls: hlsURL,
      hds: hdsURL
    }
  ];
  remote(api, params, argv)
    .then(() => {
      t.true(mockFetch.calledTwice);
      for (let i = 0; i < 2; i++) {
        const call = mockFetch.getCall(i);
        t.truthy(call);
        const {args} = call;
        t.true(typeof args[0] === 'string');
        t.true(args[0].indexOf(requestURLs[i]) === 0);
        t.truthy(args[1]);
        const [, obj] = args;
        t.is(obj.method, method);
        t.deepEqual(JSON.parse(obj.body), bodys[i]);
        t.is(obj.headers, undefined);
      }
      t.end();
    }).catch(err => {
      t.fail(`error occurred: ${err.message} ${err.trace}`);
      t.end();
    });
});
