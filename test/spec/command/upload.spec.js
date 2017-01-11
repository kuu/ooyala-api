const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const dummyFetch = {
  fetch() {
    // console.log(`[dummyFetch] url=${url}, params=${params}`);
    return Promise.resolve({
      status: 200,
      statusText: 'OK',
      headers: {
        get: () => {
          return undefined;
        }
      },
      json: dummyFetch.json
    });
  },

  json() {
    return Promise.resolve(dummyFetch.results.shift());
  },

  results: [
    {embed_code: 'xxx'},
    ['a', 'b', 'c'],
    {}, {}, {},
    {},
    {embed_code: 'xxx'},
    ['a', 'b', 'c'],
    {}, {}, {},
    {}
  ]
};

const dummyReadFile = {
  readFile(path, options, cb) {
    // console.log(`[dummyFs.readFile] path=${path}`);
    cb(null, Buffer.from([1, 2, 3]));
  }
};

const dummyStatSync = {
  statSync() {
    // console.log(`[dummyFs.statSync]`);
    return {
      isFile() {
        return true;
      }
    };
  }
};

// Override dependencies
const mockFetch = sinon.spy(dummyFetch, 'fetch');
const mockReadFile = sinon.spy(dummyReadFile, 'readFile');
const mockStatSync = sinon.spy(dummyStatSync, 'statSync');

const utils = proxyquire('../../../utils', {fs: {readFile: mockReadFile}});
const OoyalaApi = proxyquire('../../../lib', {'node-fetch': mockFetch});
const upload = proxyquire('../../../command/upload', {fs: {statSync: mockStatSync}});

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
    t.is(mockFetch.callCount, 12);
    const args = mockFetch.getCall(11).args;
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
