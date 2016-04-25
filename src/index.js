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
    const isList = !!options.pagination;

    params['expires'] = params.expires || Math.floor(Date.now() / 1000) + this.expirationTime;
    params['api_key'] = this.key;
    params['signature'] = this.sign('GET', path, params);

    const requestURL = [
      `${this.secure ? 'https' : 'http'}://${API_SERVER}${path}`,
      [
        querystring.stringify(params).replace(/'|\\'/g, '%27')
      ].join('&')
    ].join('?');

    this.logging && console.log('----------');
    this.logging && console.log(`[GET] ${requestURL}`);

    return fetch(requestURL)
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      } else {
        return {items: []};
      }
    }).then((body) => {
      if (isList) {
        this.results = this.results.concat(body.items);
        if (body.nextUrl) {
          return this.sendRequest(body.nextUrl);
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

  post(path, params={}, body={}) {
    let bodyStr = stringify(body);

    params['expires'] = params.expires || Math.floor(Date.now() / 1000) + this.expirationTime;
    params['api_key'] = this.key;
    params['signature'] = this.sign('POST', path, params, bodyStr);

    const requestURL = [
      `${this.secure ? 'https' : 'http'}://${API_SERVER}${path}`,
      [
        querystring.stringify(params).replace(/'|\\'/g, '%27')
      ].join('&')
    ].join('?');

    this.logging && console.log('----------');
    this.logging && console.log(`[POST] ${requestURL}`);

    return fetch(requestURL, {method: 'POST', body: bodyStr})
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      } else {
        return {};
      }
    }).then((body) => {
      this.logging && console.log(body);
      return body;
    });
  }

  delete(path, params={}) {
    params['expires'] = params.expires || Math.floor(Date.now() / 1000) + this.expirationTime;
    params['api_key'] = this.key;
    params['signature'] = this.sign('DELETE', path, params);

    const requestURL = [
      `${this.secure ? 'https' : 'http'}://${API_SERVER}${path}`,
      [
        querystring.stringify(params).replace(/'|\\'/g, '%27')
      ].join('&')
    ].join('?');

    this.logging && console.log('----------');
    this.logging && console.log(`[DELETE] ${requestURL}`);

    return fetch(requestURL, {method: 'DELETE'})
    .then((res) => {
      if (res.status === 200) {
        return res.text();
      } else {
        return {};
      }
    }).then((body) => {
      this.logging && console.log(body);
      return body;
    });
  }

  patch(path, params={}, body={}) {
    let bodyStr = stringify(body);

    params['expires'] = params.expires || Math.floor(Date.now() / 1000) + this.expirationTime;
    params['api_key'] = this.key;
    params['signature'] = this.sign('POST', path, params, bodyStr);

    const requestURL = [
      `${this.secure ? 'https' : 'http'}://${API_SERVER}${path}`,
      [
        querystring.stringify(params).replace(/'|\\'/g, '%27')
      ].join('&')
    ].join('?');

    this.logging && console.log('----------');
    this.logging && console.log(`[PATCH] ${requestURL}`);

    return fetch(requestURL, {method: 'PATCH', body: bodyStr})
    .then((res) => {
      if (res.status === 200) {
        return res.json();
      } else {
        return {};
      }
    }).then((body) => {
      this.logging && console.log(body);
      return body;
    });
  }
}
