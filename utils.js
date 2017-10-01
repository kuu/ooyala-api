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

  getFileSize(path) {
    return fs.statSync(path).size;
  },

  isFile(path) {
    return fs.statSync(path).isFile();
  },

  getWriteStream(path, options) {
    return fs.createWriteStream(path, options);
  },

  readFile(path, offset, length) {
    // console.log(`utils.readFile(path="${path}", offset=${offset}, length=${length})`);
    return new Promise((resolve, reject) => {
      const fd = fs.openSync(path, 'r');
      if (!fd) {
        return reject(new Error(`Unable to open file: ${path}`));
      }
      fs.read(fd, Buffer.alloc(length), 0, length, offset, (err, bytesRead, buf) => {
        if (err) {
          return reject(err);
        }
        if (bytesRead < length) {
          return reject(new Error(`Only ${bytesRead} bytes in ${length} bytes are read: ${path}`));
        }
        resolve(buf);
      });
    });
  },

  removeTailChar(str, charToRemove) {
    charToRemove.forEach(char => {
      if (str.lastIndexOf(char) === str.length - 1) {
        str = str.slice(0, -1);
      }
    });
    return str;
  },

  strip(url, queriesToRemove) {
    const queries = queriesToRemove.map(query => `${query}=`);
    queries.forEach(pattern => {
      const start = url.indexOf(pattern);
      if (start !== -1) {
        let end = url.indexOf('&', start) + 1;
        if (end === 0) {
          end = url.length;
        }
        url = url.replace(url.slice(start, end), '');
      }
    });
    return this.removeTailChar(url, ['&', '?']);
  },

  hasOwnProp(obj, propName) {
    return Object.hasOwnProperty.call(obj, propName);
  },

  tryCatch(body, errorHandler) {
    try {
      return body();
    } catch (err) {
      return errorHandler(err);
    }
  }
};

module.exports = utils;
