const test = require('ava');
const token = require('../../../command/token');
const OoyalaApi = require('../../../lib');

const API_KEY = '123456';
const API_SECRET = 'abcdef';
const api = new OoyalaApi(API_KEY, API_SECRET);

// oo token embed_code
const EXPECTED_1 = 'http://player.ooyala.com/sas/embed_token//embed_code?expires=1478482181&api_key=123456&signature=h5e1QWro%2BvqsJlPb9yI7u5mWjHDokiKt9ORal4MptmE';
test('token-1', t => {
  const params = ['embed_code'];
  const argv = {};
  token(api, params, argv)
  .then(result => {
    t.is(result, EXPECTED_1);
  })
  .catch(err => {
    t.fail(`error occurred: ${err.message} ${err.trace}`);
  });
});

// oo token embed_code1 embed_code2 --accountId david1203
const EXPECTED_2 = 'http://player.ooyala.com/sas/embed_token//embed_code1,embed_code2?expires=1478483225&api_key=123456&account_id=david1203&signature=3G4fVzyeRfPLHED8SJoVntDws9D35SckhvVP2iiBYnA';
test('token-2', t => {
  const params = ['embed_code1', 'embed_code2'];
  const argv = {accountId: 'david1203'};
  token(api, params, argv)
  .then(result => {
    t.is(result, EXPECTED_2);
  })
  .catch(err => {
    t.fail(`error occurred: ${err.message} ${err.trace}`);
  });
});
