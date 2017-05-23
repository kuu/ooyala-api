const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const utils = require('../../utils');

const requestURL = 'http://player.ooyala.com/v2/assets';
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
      this.dataHandler(Buffer.from(JSON.stringify({})));
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

test('params subdomain', async t => {
  const api = new OoyalaApi(API_KEY, API_SECRET, {subdomain: 'player'});
  const results = await api.get('/v2/assets');
  t.not(results, null);
  const params = {method: 'GET', body: '', headers: undefined};
  t.true(mockFetch.calledOnce);
  const args = mockFetch.getCall(0).args;
  t.is(utils.strip(args[0], ['expires', 'api_key', 'signature']), requestURL);
  t.deepEqual(args[1], params);
});
