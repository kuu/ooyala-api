const fs = require('fs');

const utils = {
  THROW(err) {
    throw err;
  },

  trimQuotes(str) {
    if (typeof str !== 'string') {
      return '';
    }
    let ret = str.trim();
    if (ret[0].search(/["']/) === 0) {
      ret = ret.substring(1);
    }
    if (ret[ret.length - 1].search(/["']/) === 0) {
      ret = ret.substring(0, ret.length - 1);
    }
    return ret;
  },

  readFile(path, options) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, options, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  },

  strip(url) {
    ['expires=', 'signature='].forEach(pattern => {
      const start = url.indexOf(pattern);
      if (start !== -1) {
        let end = url.indexOf('&', start) + 1;
        if (end === 0) {
          end = url.length;
        }
        url = url.replace(url.slice(start, end), '');
      }
    });
    if (url.lastIndexOf('&') === url.length - 1) {
      url = url.slice(0, -1);
    }
    return url;
  }
};

module.exports = utils;
