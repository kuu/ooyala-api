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
  }
};

module.exports = utils;
