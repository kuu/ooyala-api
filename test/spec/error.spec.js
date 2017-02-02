const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

function createResponse(status, statusText, json, text) {
  return {
    status,
    statusText,
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
    json,
    text
  };
}

const responses = [
  {
    status: 404,
    statusText: 'Not Found'
  },
  {
    status: 503,
    statusText: 'Service Unavailable'
  },
  {
    status: 204,
    statusText: 'No Content'
  },
  {
    status: 204,
    statusText: 'No Content'
  }
];

const mock = {
  counter: 0,
  fetch() {
    // console.log(`[mockFetch] url=${url}, params=${params}`);
    const res = responses[mock.counter++];
    return Promise.resolve(createResponse(res.status, res.statusText, mock.json, mock.text));
  },

  json() {
    return Promise.reject();
  },

  text() {
    return Promise.resolve(`Error #${this.counter}`);
  }
};

const API_KEY = '123456';
const API_SECRET = 'abcdef';
const FLASH_URL = 'http://flash_url.com';
let mockFetch;
let OoyalaApi;
let api;

test.beforeEach(() => {
  if (typeof mock.fetch.restore === 'function') {
    mock.fetch.restore();
  }
  mockFetch = sinon.spy(mock, 'fetch');
  OoyalaApi = proxyquire('../../lib', {'node-fetch': mockFetch});
  api = new OoyalaApi(API_KEY, API_SECRET);
});

test.cb('get', t => {
  api.get('/v2/assets', {where: `labels+INCLUDES+'Music'`}, {recursive: true})
  .catch(err => {
    const res = responses[0];
    t.is(err.message, `Response: ${res.status} ${res.statusText}`);
    t.end();
  });
});

test.cb('post', t => {
  const body = {
    name: `test ${Date()}`,
    asset_type: 'remote_asset',
    is_live_stream: true,
    stream_urls: {
      flash: FLASH_URL,
      iphone: 'http://iphone_url.com'
    }
  };
  api.post('/v2/assets', {}, body)
  .catch(err => {
    const res = responses[1];
    t.is(err.message, `Response: ${res.status} ${res.statusText}`);
    t.end();
  });
});

test.cb('get no content', t => {
  api.get('/v2/assets', {where: `labels+INCLUDES+'Music'`}, {recursive: true})
  .then(res => {
    t.is(res instanceof Array, true);
    t.is(res.length, 0);
    t.end();
  });
});

test.cb('post no content', t => {
  const body = {
    name: `test ${Date()}`,
    asset_type: 'remote_asset',
    is_live_stream: true,
    stream_urls: {
      flash: FLASH_URL,
      iphone: 'http://iphone_url.com'
    }
  };
  api.post('/v2/assets', {}, body)
  .then(res => {
    t.is(res instanceof Object, true);
    t.is(Object.keys(res).length, 0);
    t.end();
  });
});
