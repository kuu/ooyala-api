const crypto = require('crypto');
const querystring = require('querystring');
const URL = require('url');
const fetch = require('node-fetch');
const debug = require('debug');
const throughParallel = require('through2-parallel');
const utils = require('./utils');

const DEFAULT_API_SERVER = 'api.ooyala.com';
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
    return apiKey;
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

function pushValue(obj, propName, value) {
  if (!utils.hasOwnProp(obj, propName)) {
    return obj[propName] = value;
  }
  const savePropName = `original-${propName}`;
  let stack = obj[savePropName];
  if (!stack) {
    stack = obj[savePropName] = [];
  }
  stack.push(obj[propName]);
  obj[propName] = value;
}

function restoreValue(obj, propName) {
  const savePropName = `original-${propName}`;
  const stack = obj[savePropName];
  let value;
  if (stack && stack.length > 0) {
    obj[propName] = stack.pop();
    if (stack.length === 0) {
      obj[savePropName] = null;
    }
    value = obj[propName];
  } else {
    value = obj[propName];
    obj[propName] = null;
  }
  return value;
}

class OoyalaApi {
  constructor(key, secret, options = {}) {
    this.key = key;
    this.secret = secret;
    this.accountSecret = options.accountSecret || '';
    this.secure = Boolean(options.secure);
    this.expirationTime = Math.floor(options.expirationTime || (24 * 60 * 60));
    this.concurrency = Math.min(options.concurrency || DEFAULT_CONCURRENCY, MAX_CONCURRENCY);
    this.destination = options.subdomain ? `${options.subdomain}.ooyala.com` : DEFAULT_API_SERVER;
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

  signWithUid(uid, timestamp) {
    const secret = Buffer.from(this.accountSecret, 'base64');
    const hmacSha1 = crypto.createHmac('sha1', secret);
    const baseString = `${timestamp}_${uid}`;
    hmacSha1.update(Buffer.from(baseString, 'utf8'));
    return hmacSha1.digest('base64');
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

  push(options) {
    pushValue(this, 'destination', options.subdomain ? `${options.subdomain}.ooyala.com` : this.destination);
    pushValue(this, 'secure', utils.hasOwnProp(options, 'secure') ? options.secure : this.secure);
  }

  restore() {
    restoreValue(this, 'destination');
    restoreValue(this, 'secure');
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

    this.push(options);

    if (options.requestURL) {
      requestURL = options.requestURL;
    } else if (options.accountId) {
      const [uid, signatureTimestamp] = [options.accountId, options.signatureTimestamp || Math.floor(Date.now() / 1000) + 60];
      options.uid = options.signatureTimestamp = null;
      pushValue(options, 'method', method);
      method = 'POST';
      pushValue(options, 'params', params);
      params = {
        uid,
        signatureTimestamp,
        UIDSignature: this.signWithUid(uid, signatureTimestamp)
      };
      requestURL = [
        `https://player.ooyala.com/authentication/v1/providers/${getPcode(this.key)}/gigya`,
        querystring.stringify(params).replace(/'|\\'/g, '%27')
      ].join('?');
    } else {
      params.expires = params.expires || Math.floor(Date.now() / 1000) + this.expirationTime;
      params.api_key = this.key;
      params.signature = this.sign(method, path, params, bodyToSend);

      requestURL = [
        `${this.secure ? 'https' : 'http'}://${this.destination}${path}`,
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
      res.text().then(msg => print(`Error: ${res.status} ${res.statusText} ${msg}`));
      utils.THROW(new Error(`Response: ${res.status} ${res.statusText}`));
    }).then(body => {
      this.restore();
      if (options.accountId) {
        const token = body.account_token;
        options.accountId = null;
        print(`Account token: ${token}`);
        method = restoreValue(options, 'method');
        params = restoreValue(options, 'params');
        params.account_token = token;
        return this.send(method, path, params, bodyObj, options);
      }
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
