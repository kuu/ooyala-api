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

proxyquire('../../../utils', {fs: {readFile: mockReadFile}});
const OoyalaApi = proxyquire('../../../lib', {'node-fetch': mockFetch});
const upload = proxyquire('../../../command/upload', {fs: {statSync: mockStatSync}});

const API_KEY = '123456';
const API_SECRET = 'abcdef';
const api = new OoyalaApi(API_KEY, API_SECRET);

// oo upload ./path/to/file --title "My video" --chunkSize 1
const EXPECTED = 'Success: ./path/to/file (total bytes=3) embed_code="xxx"';
test.cb('upload', t => {
  const params = ['./path/to/file'];
  const argv = {title: 'My video', chunkSize: 1};
  upload(api, params, argv)
  .then(result => {
    t.is(result, EXPECTED);
    t.end();
  })
  .catch(err => {
    t.fail(`error occurred: ${err.message} ${err.trace}`);
    t.end();
  });
});
