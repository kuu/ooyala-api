const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const utils = require('../../utils');

const requestURL1 = 'https://player.ooyala.com/v2/assets';
const requestURL2 = 'http://api.ooyala.com/v2/assets';
const mock = {
  counter: 0,
  fetch() {
    // console.log(`[mockFetch] url=${url}, params=${params}`);
    return Promise.resolve({
      status: 200,
      statusText: 'OK',
      headers: {
        get: h => {
          const header = h.toLowerCase();
          if (header === 'content-type') {
            return 'application/json';
          }
          if (header === 'x-ratelimit-credits') {
            return 2;
          }
          if (header === 'x-ratelimit-reset') {
            return 1;
          }
          return 0;
        }
      },
      body: {
        dataHandler: null,
        on: bodyOn
      }
    });
  }
};

function bodyOn(type, handler) {
  if (type === 'data') {
    this.dataHandler = handler;
  } else if (type === 'end') {
    process.nextTick(() => {
      if (mock.counter++ % 2 === 0) {
        this.dataHandler(Buffer.from(JSON.stringify({items: [{}], next_page: requestURL1})));
      } else {
        this.dataHandler(Buffer.from(JSON.stringify({items: [{}]})));
      }
      handler();
    });
  }
  return {dataHandler: this.dataHandler, on: bodyOn};
}

// Override dependencies
const mockFetch = sinon.spy(mock, 'fetch');
const OoyalaApi = proxyquire('../../lib', {'node-fetch': mockFetch});

const API_KEY = '123456';
const API_SECRET = 'abcdef';
const api = new OoyalaApi(API_KEY, API_SECRET);

test('get destination', async t => {
  await api.get('/v2/assets', {}, {recursive: true, secure: true, subdomain: 'player'});
  await api.get('/v2/assets', {}, {recursive: true});
  await api.get('/v2/assets', {}, {recursive: true, secure: true, subdomain: 'player'});
  await api.get('/v2/assets', {}, {recursive: true});
  t.is(mockFetch.callCount, 8);
  let {args} = mockFetch.getCall(1);
  t.is(utils.strip(args[0], ['expires', 'api_key', 'signature']), requestURL1);
  ({args} = mockFetch.getCall(3));
  t.is(utils.strip(args[0], ['expires', 'api_key', 'signature']), requestURL2);
  ({args} = mockFetch.getCall(5));
  t.is(utils.strip(args[0], ['expires', 'api_key', 'signature']), requestURL1);
  ({args} = mockFetch.getCall(7));
  t.is(utils.strip(args[0], ['expires', 'api_key', 'signature']), requestURL2);
});
