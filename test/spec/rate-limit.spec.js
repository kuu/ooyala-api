const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const utils = require('../../utils');

const CONCURRENCY = 3;
const mock = {
  counter: 0,
  fetch() {
    // console.log(`[mockFetch] url=${url}, params=${params}`);
    const credits = CONCURRENCY - (mock.counter < CONCURRENCY ? mock.counter++ : (mock.counter++ % 2));
    return Promise.resolve({
      status: 200,
      statusText: 'OK',
      headers: {
        get: h => {
          const header = h.toLowerCase();
          if (header === 'x-ratelimit-credits') {
            return credits;
          }
          if (header === 'x-ratelimit-reset') {
            return 1;
          }
          return 0;
        }
      },
      json: mock.json
    });
  },

  json() {
    return Promise.resolve({items: [{}]});
  }
};

// Override dependencies
const mockFetch = sinon.spy(mock, 'fetch');
const OoyalaApi = proxyquire('../../lib', {'node-fetch': mockFetch});

const API_KEY = '123456';
const API_SECRET = 'abcdef';
const api = new OoyalaApi(API_KEY, API_SECRET, {concurrency: 3});

test('rate-limit', async t => {
  for (let i = 0; i < 8; i++) {
    const results = await api.get(`/v2/assets/${i}`, {}, {recursive: true});
    t.not(results, null);
    t.not(results.length, 0);
    const requestURL = `http://api.ooyala.com/v2/assets/${i}`;
    const params = {method: 'GET', body: '', headers: undefined};
    const args = mockFetch.getCall(i).args;
    t.is(utils.strip(args[0], ['expires', 'api_key', 'signature']), requestURL);
    t.deepEqual(args[1], params);
  }
});
