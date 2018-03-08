const test = require('ava');
const sign = require('../../../command/sign');
const OoyalaApi = require('../../../lib');

const API_KEY = '123456';
const API_SECRET = 'abcdef';
const api = new OoyalaApi(API_KEY, API_SECRET);

//  oo sign /hoge?foo=bar
const EXPECTED_1 = 'QsDDV+2fqLhcbbKBF6nIiobJsBMM6vx55R6ei1eZXRM';
test.cb('sign-1', t => {
  const params = ['/hoge?foo=bar'];
  const argv = {};
  sign(api, params, argv)
    .then(result => {
      t.is(result, EXPECTED_1);
      t.end();
    }).catch(err => {
      t.fail(`error occurred: ${err.message} ${err.trace}`);
      t.end();
    });
});

//  oo sign /hoge?foo=bar --body '{"data": {"comment": "This is JSON"}}'
const EXPECTED_2 = 'HFDtN/0CmbE2hOcc1uVphTtJu6mijUS6RFGNejSMn10';
test.cb('sign-2', t => {
  const params = ['/hoge?foo=bar'];
  const argv = {body: '{"data": {"comment": "This is JSON"}}'};
  sign(api, params, argv)
    .then(result => {
      t.is(result, EXPECTED_2);
      t.end();
    }).catch(err => {
      t.fail(`error occurred: ${err.message} ${err.trace}`);
      t.end();
    });
});

//  oo sign /hoge?foo=bar --body '{"data": {"comment": "This is JSON"}}' --method PATCH
const EXPECTED_3 = 'qfEZj40ntMZl1jGGAPBIO7kt8IDHAy2DHH7BdP/eVUE';
test.cb('sign-3', t => {
  const params = ['/hoge?foo=bar'];
  const argv = {
    body: '{"data": {"comment": "This is JSON"}}',
    method: 'PATCH'
  };
  sign(api, params, argv)
    .then(result => {
      t.is(result, EXPECTED_3);
      t.end();
    }).catch(err => {
      t.fail(`error occurred: ${err.message} ${err.trace}`);
      t.end();
    });
});
