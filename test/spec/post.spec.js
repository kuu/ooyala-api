const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const mock = {
  fetch(url, params) {
    console.log(`[mockFetch] url=${url}, params=${params}`);
    return Promise.resolve({
      status: 200,
      statusText: 'OK',
      headers: {
        get: () => {
          return undefined;
        }
      },
      json: mock.json
    });
  },

  json() {
    return Promise.resolve({});
  }
};

// Override dependencies
const mockFetch = sinon.spy(mock, 'fetch');
const OoyalaApi = proxyquire('../../lib', {'node-fetch': mockFetch});

const API_KEY = '123456';
const API_SECRET = 'abcdef';
const api = new OoyalaApi(API_KEY, API_SECRET);
const FLASH_URL = 'http://flash_url.com';

// let embedCode;

test('post', t => {
  const body = {
    name: `test ${Date()}`,
    asset_type: 'remote_asset',
    is_live_stream: true,
    stream_urls: {
      flash: FLASH_URL,
      iphone: 'http://iphone_url.com'
    }
  };
  return api.post('/v2/assets', {}, body).then(result => {
    t.not(result, null);
    const requestURL = 'http://api.ooyala.com/v2/assets';
    const params = {method: 'POST', body: JSON.stringify(body)};
    t.true(mockFetch.calledWithMatch(requestURL, params));
  }).catch(err => {
    t.fail(`error occurred.: ${err.trace}`);
  });
});
