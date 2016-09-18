const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const mock = {
  fetch(url, params) {
    console.log(`[mockFetch] url=${url}, params=${params}`);
    return Promise.resolve({status: 200, statusText: 'OK', json: mock.json});
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
const api = new OoyalaApi(API_KEY, API_SECRET);

test('get', t => {
  return api.get('/v2/assets', {where: `labels+INCLUDES+'Music'`}, {recursive: true})
  .then(results => {
    t.not(results, null);
    t.not(results.length, 0);
    const requestURL = 'http://api.ooyala.com/v2/assets?where=labels%2BINCLUDES%2B%27Music%27';
    const params = {method: 'GET', body: ''};
    t.true(mockFetch.calledWithMatch(requestURL, params));
  }).catch(err => {
    t.fail(`error occurred.: ${err.trace}`);
  });
});
