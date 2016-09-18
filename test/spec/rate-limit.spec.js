const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const fromArray = require('from2-array');
const through = require('through2');

const mock = {
  counter: 0,
  fetch(url, params) {
    console.log(`[mockFetch] url=${url}, params=${params}`);
    const credits = mock.counter < 2 ? 3 - mock.counter++ : 3 - (mock.counter++ % 2);
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
const api = new OoyalaApi(API_KEY, API_SECRET);

test('get', t => {
  return new Promise((resolve, reject) => {
    fromArray.obj([0, 1, 2, 3, 4])
    .pipe(through.obj((item, enc, cb) => {
      api.get(`/v2/assets/${item}`, {}, {recursive: true})
      .then(results => {
        t.not(results, null);
        t.not(results.length, 0);
        const requestURL = `http://api.ooyala.com/v2/assets/${item}`;
        const params = {method: 'GET', body: ''};
        t.true(mockFetch.calledWithMatch(requestURL, params));
        cb();
      }).catch(err => {
        t.fail(`error occurred.: ${err.trace}`);
        cb();
      });
    }))
    .on('finish', () => {
      resolve();
    })
    .on('error', err => {
      reject(err);
    });
  });
});
