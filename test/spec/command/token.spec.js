const test = require('ava');
const rewire = require('rewire');
const token = require('../../../command/token');
const utils = require('../../../utils');

const OoyalaApi = rewire('../../../lib');

class FakeDate extends Date {
  static now() {
    console.log(`FakeDate.now() is called~`);
    return 1478482181000;
  }
}

test.beforeEach(() => {
  OoyalaApi.__set__({
    Date: FakeDate
  });
});

const API_KEY = '123456';
const API_SECRET = 'abcdef';
const api = new OoyalaApi(API_KEY, API_SECRET);

// oo token embed_code
const EXPECTED_1 = 'http://player.ooyala.com/sas/embed_token//embed_code?api_key=123456';
test.cb('token-1', t => {
  const params = ['embed_code'];
  const argv = {};
  token(api, params, argv)
  .then(result => {
    t.is(utils.strip(result), EXPECTED_1);
    t.end();
  })
  .catch(err => {
    t.fail(`error occurred: ${err.message} ${err.trace}`);
    t.end();
  });
});

// oo token embed_code1 embed_code2 --accountId david1203
const EXPECTED_2 = 'http://player.ooyala.com/sas/embed_token//embed_code1,embed_code2?api_key=123456&account_id=david1203';
test.cb('token-2', t => {
  const params = ['embed_code1', 'embed_code2'];
  const argv = {accountId: 'david1203'};
  token(api, params, argv)
  .then(result => {
    t.is(utils.strip(result), EXPECTED_2);
    t.end();
  })
  .catch(err => {
    t.fail(`error occurred: ${err.message} ${err.trace}`);
    t.end();
  });
});
