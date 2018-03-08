const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const utils = require('../../utils');

const requestURL = 'http://api.ooyala.com/v2/assets?where=labels%2BINCLUDES%2B%27Music%27';
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
        this.dataHandler(Buffer.from(JSON.stringify({items: [{}], next_page: requestURL})));
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

test('get', async t => {
  const results = await api.get('/v2/assets', {where: `labels+INCLUDES+'Music'`}, {recursive: true});
  t.not(results, null);
  t.not(results.length, 0);
  const params = {method: 'GET', body: null, headers: undefined};
  t.true(mockFetch.calledTwice);
  const {args} = mockFetch.getCall(0);
  t.is(utils.strip(args[0], ['expires', 'api_key', 'signature']), requestURL);
  t.deepEqual(args[1], params);
});
