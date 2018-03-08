const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const dummyFetch = {
  fetch() {
  // fetch(url, params) {
    // console.log(`[dummyFetch] url=${url}, params=${JSON.stringify(params, null, 2)}`);
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
    {embed_code: 'xxx'},
    {embed_code: 'xxx'},
    ['a', 'b', 'c'],
    ['a'],
    ['a', 'b'],
    {}, {}, {},
    {},
    {}, {},
    {},
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

const API_KEY = '123456';
const API_SECRET = 'abcdef';

function unwrap(obj) {
  if (typeof obj.restore === 'function') {
    obj.restore();
  }
}

function createMock() {
  // Override dependencies
  unwrap(dummyFetch.fetch);
  const mockFetch = sinon.spy(dummyFetch, 'fetch');
  unwrap(dummyOpenSync.openSync);
  const mockOpenSync = sinon.spy(dummyOpenSync, 'openSync');
  unwrap(dummyRead.read);
  const mockRead = sinon.spy(dummyRead, 'read');
  unwrap(dummyStatSync.statSync);
  const mockStatSync = sinon.spy(dummyStatSync, 'statSync');
  const utils = proxyquire('../../../utils', {fs: {openSync: mockOpenSync, read: mockRead, statSync: mockStatSync}});
  const OoyalaApi = proxyquire('../../../lib', {'node-fetch': mockFetch});
  const api = new OoyalaApi(API_KEY, API_SECRET);
  const upload = require('../../../command/upload');
  return {upload, api, utils, mockFetch};
}

const EXPECTED = 'Success: ./path/to/file (total bytes=3) embed_code="xxx"';

test('upload', async t => {
  const {upload, api, utils, mockFetch} = createMock();
  const result = await upload(api, ['./path/to/file'], {title: 'My video', chunkSize: 1});
  t.is(result, EXPECTED);
  const {args} = mockFetch.getCall(mockFetch.callCount - 1);
  const requestURL = 'http://api.ooyala.com/v2/assets/xxx/upload_status';
  t.is(utils.strip(args[0], ['expires', 'api_key', 'signature']), requestURL);
  const body = {status: 'uploaded'};
  const params = {method: 'PUT', body: JSON.stringify(body), headers: undefined};
  t.deepEqual(args[1], params);
});

test('upload:profile', async t => {
  const {upload, api, utils, mockFetch} = createMock();
  const result = await upload(api, ['./path/to/file'], {title: 'My video', profile: 'yyy'});
  t.is(result, EXPECTED);
  const {args} = mockFetch.getCall(mockFetch.callCount - 1);
  const requestURL = 'http://api.ooyala.com/v2/assets/xxx/process';
  t.is(utils.strip(args[0], ['expires', 'api_key', 'signature']), requestURL);
  const body = {initiation_type: 'original_ingest', processing_profile_id: 'yyy'};
  const params = {method: 'POST', body: JSON.stringify(body), headers: undefined};
  t.deepEqual(args[1], params);
});

test('upload:vr360', async t => {
  const {upload, api, mockFetch} = createMock();
  const vrType = 'monoscopic';
  const result = await upload(api, ['./path/to/file'], {title: 'My video', profile: 'zzz', vrType});
  t.is(result, EXPECTED);
  const {args} = mockFetch.getCall(0);
  const [, {body}] = args;
  const {vr360type} = JSON.parse(body);
  t.deepEqual(vr360type, vrType);
});
