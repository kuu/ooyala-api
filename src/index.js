import fetch from 'node-fetch';
import querystring from 'querystring';
import crypto from 'crypto';

const API_SERVER = 'api.ooyala.com';

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
    this.logging = !!options.log;
  }

  sign(method, path, params, body='') {
    const sha256 = crypto.createHash('sha256');
    sha256.update([ this.secret, method, path , serialize(params, '', true), body].join(''));
    return sha256.digest('base64').slice(0,43);
  }

  get(path, params={}, options={}) {
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
    const isList = !!options.pagination;
    const bodyStr = body ? stringify(body) : '';

    this.results = [];

    params['expires'] = params.expires || Math.floor(Date.now() / 1000) + this.expirationTime;
    params['api_key'] = this.key;
    params['signature'] = this.sign(method, path, params, bodyStr);

    const requestURL = [
      `${this.secure ? 'https' : 'http'}://${API_SERVER}${path}`,
      [
        querystring.stringify(params).replace(/'|\\'/g, '%27')
      ].join('&')
    ].join('?');

    this.logging && console.log(`[${method}] ${requestURL}
    ${bodyStr}`);

    return fetch(requestURL, {method, body: bodyStr})
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      } else {
        return isList ? {items: []} : {};
      }
    }).then((body) => {
      if (isList) {
        this.results = this.results.concat(body.items);
        if (body.nextUrl) {
          return fetch(body.nextUrl);
        } else {
          this.logging && console.log(this.results);
          return this.results;
        }
      } else {
        this.logging && console.log(body);
        return body;
      }
    });
  }
}
