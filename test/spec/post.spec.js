const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const utils = require('../../utils');

const mock = {
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
          return undefined;
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

const API_KEY = '123456';
const API_SECRET = 'abcdef';
const FLASH_URL = 'http://flash_url.com';

test('post', async t => {
  // Override dependencies
  if (typeof mock.fetch.restore === 'function') {
    mock.fetch.restore();
  }
  const mockFetch = sinon.spy(mock, 'fetch');
  const OoyalaApi = proxyquire('../../lib', {'node-fetch': mockFetch});
  const api = new OoyalaApi(API_KEY, API_SECRET);

  const body = {
    name: `test ${new Date()}`,
    asset_type: 'remote_asset',
    is_live_stream: true,
    stream_urls: {
      flash: FLASH_URL,
      iphone: 'http://iphone_url.com'
    }
  };
  const requestURL = 'http://api.ooyala.com/v2/assets';
  const params = {method: 'POST', body: JSON.stringify(body), headers: undefined};
  const result = await api.post('/v2/assets', {}, body);
  t.not(result, null);
  t.true(mockFetch.calledOnce);
  const {args} = mockFetch.getCall(0);
  t.is(utils.strip(args[0], ['expires', 'api_key', 'signature']), requestURL);
  t.deepEqual(args[1], params);
});

test('post:body-text', async t => {
  // Override dependencies
  if (typeof mock.fetch.restore === 'function') {
    mock.fetch.restore();
  }
  const mockFetch = sinon.spy(mock, 'fetch');
  const OoyalaApi = proxyquire('../../lib', {'node-fetch': mockFetch});
  const api = new OoyalaApi(API_KEY, API_SECRET);

  const body = '<body></body>';
  const params = {method: 'POST', body, headers: undefined};
  const result = await api.post('/v2/assets', {}, body);
  t.not(result, null);
  t.true(mockFetch.calledOnce);
  const {args} = mockFetch.getCall(0);
  t.deepEqual(args[1], params);
});
