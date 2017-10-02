const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const source = require('../../../command/source');

const dummyInfo = {
  reconstituted_source_file_available: true,
  file_size: 595460784,
  uploaded_by_client: null,
  source_file_url: null,
  original_file_name: null
};

const dummyFetch = {
  fetch() {
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

  results: [dummyInfo]
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

// Override dependencies
const mockFetch = sinon.spy(dummyFetch, 'fetch');

const OoyalaApi = proxyquire('../../../lib', {'node-fetch': mockFetch});

const API_KEY = '123456';
const API_SECRET = 'abcdef';
const api = new OoyalaApi(API_KEY, API_SECRET);

// oo source embed_code1 --info
test.cb('source info', t => {
  source(api, 'embed_code1', {info: true})
  .then(result => {
    t.truthy(result);
    t.deepEqual(result, dummyInfo);
    t.end();
  })
  .catch(err => {
    t.fail(`error occurred: ${err.message} ${err.trace}`);
    t.end();
  });
});
