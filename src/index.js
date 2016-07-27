import fetch from 'node-fetch';
import querystring from 'querystring';
import crypto from 'crypto';
import debug from 'debug';

const API_SERVER = 'api.ooyala.com';
const TOKEN_SERVER = 'player.ooyala.com';
const print = debug('oo');

function serialize(params, delimiter, sort) {
  let keys = Object.keys(params);
  if (sort) {
    keys = keys.sort();
  }
  return keys.map((key) => {
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

function quote(value) {
  if (typeof value === 'number') {
    return value + '';
  } else {
    return `'${value}'`;
  }
}

function stringify(data) {
  let str;
  try {
    str = JSON.stringify(data);
  } catch (e) {
    str = '';
  }
  return str;
}

export default class OoyalaApi {
  constructor(key, secret, options={}) {
    this.key = key;
    this.secret = secret;
    this.secure = !!options.secure;
    this.expirationTime = Math.floor(options.expirationTime || (24 * 60 * 60));
    this.results = [];
    this.recursive = false;
  }

  sign(method, path, params, body='') {
    const sha256 = crypto.createHash('sha256');
    sha256.update([ this.secret, method, path , serialize(params, '', true), body].join(''));
    return sha256.digest('base64').slice(0,43);
  }

  get(path, params={}, options={}) {
    this.recursive = !!options.recursive;
    this.results = [];
    return this.send('GET', path, params, null, options);
  }

  post(path, params={}, body={}) {
    return this.send('POST', path, params, body);
  }

  put(path, params={}, body={}) {
    return this.send('PUT', path, params, body);
  }

  delete(path, params={}) {
    return this.send('DELETE', path, params, null);
  }

  patch(path, params={}, body={}) {
    return this.send('PATCH', path, params, body);
  }

  send(method, path, params={}, body={}, options={}) {
    const bodyStr = body ? stringify(body) : '';

    params['expires'] = params.expires || Math.floor(Date.now() / 1000) + this.expirationTime;
    params['api_key'] = this.key;
    params['signature'] = this.sign(method, path, params, bodyStr);

    const requestURL = [
      `${this.secure ? 'https' : 'http'}://${API_SERVER}${path}`,
      [
        querystring.stringify(params).replace(/'|\\'/g, '%27')
      ].join('&')
    ].join('?');

    print(`[${method}] ${requestURL}
    ${bodyStr}`);

    return fetch(requestURL, {method, body: bodyStr})
    .then(res => {
      if (res.status === 200) {
        return res.json();
      } else {
        return this.recursive ? {items: []} : {};
      }
    }).then(body => {
      if (this.recursive) {
        this.results = this.results.concat(body.items);
        if (body.next_page) {
          const [path, params] = body.next_page.split('?');
          const paramsObj = {};
          params.split('&').forEach(param => {
            const [key, value] = param.split('=');
            paramsObj[key] = value;
          });
          return this.send('GET', path, paramsObj, null);
        } else {
          print(`Results: ${this.results}`);
          return this.results;
        }
      } else {
        print(body);
        return body;
      }
    });
  }

  getTokenRequest(embedCode, accountId='') {
    print(`getTokenRequest(embedCode="${embedCode}", accountId="${accountId}"`);

    const pcode = getPcode(this.key);
    const path = `/sas/embed_token/${pcode}/${embedCode}`;
    const params = {};
    params['expires'] = Math.floor(Date.now() / 1000) + this.expirationTime;
    params['api_key'] = this.key;
    if (accountId) {
      params['account_id'] = accountId;
    }
    params['signature'] = this.sign('GET', path, params);

    const token = [
      `http://${TOKEN_SERVER}${path}`,
      [
        querystring.stringify(params).replace(/'|\\'/g, '%27')
      ].join('&')
    ].join('?');

    print(`token="${token}"`);

    return token;
  }
}
