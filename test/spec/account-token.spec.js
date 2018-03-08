const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const utils = require('../../utils');

const ACCOUNT_TOKEN = 'abcd1234';

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
      if (mock.counter++ === 0) {
        this.dataHandler(Buffer.from(JSON.stringify({account_token: ACCOUNT_TOKEN})));
      } else {
        this.dataHandler(Buffer.from(JSON.stringify({status: 'success'})));
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
const ACCOUNT_SECRET = 'ghijkl';
const ACCOUNT_ID = 'mnopqr';

const api = new OoyalaApi(API_KEY, API_SECRET, {accountSecret: ACCOUNT_SECRET});

const requestURL1 = `https://player.ooyala.com/authentication/v1/providers/${API_KEY}/gigya?uid=${ACCOUNT_ID}`;
const requestURL2 = `https://player.ooyala.com/personalization/v1/trending?limit=5&account_token=${ACCOUNT_TOKEN}`;

test('account-token', async t => {
  const results = await api.get('/personalization/v1/trending', {limit: 5}, {accountId: ACCOUNT_ID, subdomain: 'player', secure: true});
  t.not(results, null);
  t.is(results.status, 'success');
  t.true(mockFetch.calledTwice);
  const args1 = mockFetch.getCall(0).args;
  t.is(utils.strip(args1[0], ['signatureTimestamp', 'UIDSignature']), requestURL1);
  t.deepEqual(args1[1], {method: 'POST', body: null, headers: undefined});
  const args2 = mockFetch.getCall(1).args;
  t.is(utils.strip(args2[0], ['expires', 'api_key', 'signature']), requestURL2);
  t.deepEqual(args2[1], {method: 'GET', body: null, headers: undefined});
});
