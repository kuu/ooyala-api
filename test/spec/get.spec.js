const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

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
          if (header === 'x-ratelimit-credits') {
            return 2;
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
    if (mock.counter++ === 0) {
      return Promise.resolve({items: [{}], next_page: requestURL});
    }
    return Promise.resolve({items: [{}]});
  }
};

// Override dependencies
const mockFetch = sinon.spy(mock, 'fetch');
const OoyalaApi = proxyquire('../../lib', {'node-fetch': mockFetch});

const API_KEY = '123456';
const API_SECRET = 'abcdef';
const api = new OoyalaApi(API_KEY, API_SECRET);

test('get', t => {
  return api.get('/v2/assets', {where: `labels+INCLUDES+'Music'`}, {recursive: true})
  .then(results => {
    t.not(results, null);
    t.not(results.length, 0);
    const params = {method: 'GET', body: ''};
    t.true(mockFetch.calledWithMatch(requestURL, params));
  }).catch(err => {
    t.fail(`error occurred: ${err.message} ${err.trace}`);
  });
});
