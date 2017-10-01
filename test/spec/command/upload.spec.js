const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const dummyFetch = {
  fetch() {
  // fetch(url, params) {
    // console.log(`[dummyFetch] url=${url}, params=${params}`);
    return Promise.resolve({
      status: 200,
      statusText: 'OK',
      headers: {
        get: h => {
          const header = h.toLowerCase();
          if (header === 'content-type') {
            return 'application/json';
          }
          return null;
        }
      },
      body: {
        dataHandler: null,
        on: bodyOn
      }
    });
  },

  results: [
    {embed_code: 'xxx'},
    ['a', 'b', 'c'],
    {}, {}, {},
    {},
    {embed_code: 'xxx'},
    ['a'],
    {},
    {}
  ]
};

function bodyOn(type, handler) {
  if (type === 'data') {
    this.dataHandler = handler;
  } else if (type === 'end') {
    process.nextTick(() => {
      this.dataHandler(Buffer.from(JSON.stringify(dummyFetch.results.shift())));
      handler();
    });
  }
  return {dataHandler: this.dataHandler, on: bodyOn};
}

const dummyOpenSync = {
  openSync() {
  // openSync(path, flag) {
    // console.log(`[dummyFs.openSync] path=${path} flag="${flag}"`);
    return 1;
  }
};

const dummyRead = {
  read(fd, buffer, offset, length, position, cb) {
    // console.log(`[dummyFs.dummyRead] offset=${offset} length=${length} position=${position}`);
    cb(null, length, buffer);
  }
};

const dummyStatSync = {
  statSync() {
    // console.log(`[dummyFs.statSync]`);
    return {
      isFile() {
        return true;
      },
      size: 3
    };
  }
};

// Override dependencies
const mockFetch = sinon.spy(dummyFetch, 'fetch');
const mockOpenSync = sinon.spy(dummyOpenSync, 'openSync');
const mockRead = sinon.spy(dummyRead, 'read');
const mockStatSync = sinon.spy(dummyStatSync, 'statSync');

const utils = proxyquire('../../../utils', {fs: {openSync: mockOpenSync, read: mockRead, statSync: mockStatSync}});
const OoyalaApi = proxyquire('../../../lib', {'node-fetch': mockFetch});
const upload = require('../../../command/upload');

const API_KEY = '123456';
const API_SECRET = 'abcdef';
const api = new OoyalaApi(API_KEY, API_SECRET);

// oo upload ./path/to/file --title "My video" --chunkSize 1
const EXPECTED = 'Success: ./path/to/file (total bytes=3) embed_code="xxx"';
test.cb('upload', t => {
  upload(api, ['./path/to/file'], {title: 'My video', chunkSize: 1})
  .then(result => {
    t.is(result, EXPECTED);
    t.is(mockFetch.callCount, 6);
    const args = mockFetch.getCall(5).args;
    const requestURL = 'http://api.ooyala.com/v2/assets/xxx/upload_status';
    const body = {status: 'uploaded'};
    const params = {method: 'PUT', body: JSON.stringify(body), headers: undefined};
    t.is(utils.strip(args[0], ['expires', 'api_key', 'signature']), requestURL);
    t.deepEqual(args[1], params);
    return upload(api, ['./path/to/file'], {title: 'My video', profile: 'yyy'});
  })
  .then(result => {
    t.is(result, EXPECTED);
    t.is(mockFetch.callCount, 10);
    const args = mockFetch.getCall(9).args;
    const requestURL = 'http://api.ooyala.com/v2/assets/xxx/process';
    const body = {initiation_type: 'original_ingest', processing_profile_id: 'yyy'};
    const params = {method: 'POST', body: JSON.stringify(body), headers: undefined};
    t.is(utils.strip(args[0], ['expires', 'api_key', 'signature']), requestURL);
    t.deepEqual(args[1], params);
    t.end();
  })
  .catch(err => {
    t.fail(`error occurred: ${err.message} ${err.trace}`);
    t.end();
  });
});
