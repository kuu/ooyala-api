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

// Override dependencies
const mockFetch = sinon.spy(mock, 'fetch');
const OoyalaApi = proxyquire('../../lib', {'node-fetch': mockFetch});

const API_KEY = '123456';
const API_SECRET = 'abcdef';
const api = new OoyalaApi(API_KEY, API_SECRET);
const FLASH_URL = 'http://flash_url.com';

// let embedCode;

test('post', async t => {
  const body = {
    name: `test ${Date()}`,
    asset_type: 'remote_asset',
    is_live_stream: true,
    stream_urls: {
      flash: FLASH_URL,
      iphone: 'http://iphone_url.com'
    }
  };
  const result = await api.post('/v2/assets', {}, body);
  t.not(result, null);
  const requestURL = 'http://api.ooyala.com/v2/assets';
  const params = {method: 'POST', body: JSON.stringify(body), headers: undefined};
  t.true(mockFetch.calledOnce);
  const args = mockFetch.getCall(0).args;
  t.is(utils.strip(args[0], ['expires', 'api_key', 'signature']), requestURL);
  t.deepEqual(args[1], params);
});
