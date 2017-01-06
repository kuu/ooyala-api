const crypto = require('crypto');
const querystring = require('querystring');
const URL = require('url');
const fetch = require('node-fetch');
const debug = require('debug');
const throughParallel = require('through2-parallel');
const utils = require('./utils');

const API_SERVER = 'api.ooyala.com';
const TOKEN_SERVER = 'player.ooyala.com';
const DEFAULT_CONCURRENCY = 5;
const MAX_CONCURRENCY = 10;
const print = debug('oo');

function createStream(concurrency, transformFunction, flushFunction) {
  return throughParallel.obj({concurrency}, transformFunction, flushFunction);
}

class ParallelStream {
  constructor(concurrency, oo) {
    this.stream = createStream(concurrency, (obj, enc, cb) => {
      print(`request: wait for ${oo.secondsToWait} sec`);
      setTimeout(() => {
        oo.send(...obj.params)
        .then(data => {
          obj.resolve(data);
          cb();
        }).catch(err => {
          obj.reject(err);
          cb();
        });
      }, oo.secondsToWait * 1000);
    });
  }

  add(params, resolve, reject) {
    this.stream.write({params, resolve, reject});
  }
}

function parseRateLimit(res, param) {
  const defaultValue = param === 'Credits' ? MAX_CONCURRENCY : 0;

  if (!res.headers) {
    return defaultValue;
  }
  const value = res.headers.get(`X-RateLimit-${param}`);
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const num = parseInt(value, 10);
    if (Number.isNaN(num)) {
      return defaultValue;
    }
    return num;
  }
  return defaultValue;
}

function serialize(params, delimiter, sort) {
  let keys = Object.keys(params);
  if (sort) {
    keys = keys.sort();
  }
  return keys.map(key => {
    return `${key}=${params[key]}`;
  }).join(delimiter);
}

function getPcode(apiKey) {
  const idx = apiKey.lastIndexOf('.');
  if (idx === -1) {
    return '';
  }
  return apiKey.substring(0, idx);
}

function stringify(data) {
  let str;
  try {
    str = JSON.stringify(data);
  } catch (err) {
    str = '';
  }
  return str;
}

class OoyalaApi {
  constructor(key, secret, options = {}) {
    this.key = key;
    this.secret = secret;
    this.secure = Boolean(options.secure);
    this.expirationTime = Math.floor(options.expirationTime || (24 * 60 * 60));
    this.concurrency = Math.min(options.concurrency || DEFAULT_CONCURRENCY, MAX_CONCURRENCY);
    this.credits = MAX_CONCURRENCY;
    this.secondsToWait = 0;
    this.sequencialStream = new ParallelStream(1, this);
    this.parallelStream = new ParallelStream(this.concurrency, this);
  }

  sign(method, path, params, body = '') {
    const sha256 = crypto.createHash('sha256');
    sha256.update([this.secret, method, path, serialize(params, '', true), body].join(''));
    return sha256.digest('base64').slice(0, 43);
  }

  get(path, params = {}, options = {}) {
    if (options.recursive) {
      options.results = [];
    }
    return this.request('GET', path, params, null, options);
  }

  post(path, params = {}, body = {}, options = {}) {
    return this.request('POST', path, params, body, options);
  }

  put(path, params = {}, body = {}, options = {}) {
    return this.request('PUT', path, params, body, options);
  }

  delete(path, params = {}, options = {}) {
    return this.request('DELETE', path, params, null, options);
  }

  patch(path, params = {}, body = {}, options = {}) {
    return this.request('PATCH', path, params, body, options);
  }

  request(...params) {
    return new Promise((resolve, reject) => {
      if (this.credits < this.concurrency) {
        this.sequencialStream.add(params, resolve, reject);
      } else {
        this.parallelStream.add(params, resolve, reject);
      }
    });
  }

  send(method, path, params = {}, bodyObj = {}, options = {}) {
    let bodyToSend;

    if (Buffer.isBuffer(bodyObj)) {
      bodyToSend = bodyObj;
    } else {
      bodyToSend = bodyObj ? stringify(bodyObj) : '';
    }

    if (params === null) {
      params = {};
    }

    let requestURL;

    if (options.requestURL) {
      requestURL = options.requestURL;
    } else {
      params.expires = params.expires || Math.floor(Date.now() / 1000) + this.expirationTime;
      params.api_key = this.key;
      params.signature = this.sign(method, path, params, bodyToSend);

      requestURL = [
        `${this.secure ? 'https' : 'http'}://${API_SERVER}${path}`,
        querystring.stringify(params).replace(/'|\\'/g, '%27')
      ].join('?');
    }

    print(`[${method}] ${requestURL}
    ${Buffer.isBuffer(bodyToSend) ? `[Buffer length=${bodyToSend.length}]` : bodyToSend}`);

    return fetch(requestURL, {method, body: bodyToSend, headers: options.headers})
    .then(res => {
      this.credits = parseRateLimit(res, 'Credits');
      print(`'X-RateLimit-Credits': ${this.credits}`);
      if (this.credits < this.concurrency) {
        this.secondsToWait = parseRateLimit(res, 'Reset');
        print(`'X-RateLimit-Reset': ${this.secondsToWait}`);
      } else {
        this.secondsToWait = 0;
      }
      print(`${res.status} ${res.statusText}`);
      if (res.status >= 200 && res.status < 300) {
        return res.json().catch(() => Promise.resolve(options.recursive ? {items: []} : {}));
      }
      utils.THROW(new Error(`Response: ${res.status} ${res.statusText}`));
    }).then(body => {
      if (options.recursive) {
        const list = body.items || body.results;
        print(`Already retrieved: ${options.results.length}, newly retrieved: ${list.length}`);
        options.results = options.results.concat(list);
        if (body.next_page) {
          const {pathname, query} = URL.parse(body.next_page, true);
          return this.send('GET', pathname, query, null, options);
        }
        print(`Results: ${options.results.length} items`);
        return options.results;
      }
      print(body);
      return body;
    });
  }

  getTokenRequest(embedCode, accountId = '') {
    print(`getTokenRequest(embedCode="${embedCode}", accountId="${accountId}")`);

    const pcode = getPcode(this.key);
    const path = `/sas/embed_token/${pcode}/${embedCode}`;
    const params = {};

    params.expires = Math.floor(Date.now() / 1000) + this.expirationTime;
    params.api_key = this.key;

    if (accountId) {
      params.account_id = accountId;
    }
    params.signature = this.sign('GET', path, params);

    const token = [
      `http://${TOKEN_SERVER}${path}`,
      querystring.stringify(params).replace(/'|\\'/g, '%27')
    ].join('?');

    print(`token="${token}"`);

    return token;
  }
}

module.exports = OoyalaApi;
// es2015 default export compatibility
module.exports.default = module.exports;
