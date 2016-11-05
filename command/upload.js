const fs = require('fs');
const path = require('path');
const debug = require('debug');
const utils = require('../utils');

const print = debug('oo');

function getTitle(argv, fileName, index) {
  let title;
  if (argv.title) {
    title = utils.trimQuotes(argv.title);
    if (index > 0) {
      title = `${title} - part ${index + 1}`;
    }
  } else {
    title = fileName;
  }
  return title;
}

function uploadFiles(api, params, argv) {
  if (params.length === 0) {
    utils.THROW(new Error('File is not specified.'));
  }
  const chunkSize = argv.chunkSize || 204800;
  params.forEach((file, i) => {
    if (fs.statSync(file).isFile() === false) {
      utils.THROW(new Error(`Invalid path: ${file}`));
    }
    const fileName = path.basename(file);
    const title = getTitle(argv, fileName, i);
    uploadFile(api, file, title, fileName, chunkSize);
  });
}

function uploadFile(api, file, title, fileName, chunkSize) {
  print(`upload: path='${file}' chunkSize='${chunkSize}' title='${title}'`);

  fs.readFile(file, (err, buf) => {
    if (err) {
      utils.THROW(err);
    }

    let embedCode;

    api.post('/v2/assets', {}, {
      name: title,
      file_name: fileName,
      asset_type: 'video',
      file_size: buf.length,
      chunk_size: chunkSize
    })
    .then(result => {
      embedCode = result.embed_code;
      return api.get(`/v2/assets/${embedCode}/uploading_urls`);
    })
    .then(result => {
      return Promise.all(result.map((url, i) => {
        const offset = chunkSize * i;
        const length = Math.min(chunkSize, buf.length - offset);
        print(`[PUT] offset=${offset} length=${length} ${url}`);
        return api.put(null, {}, buf.slice(offset, offset + length), {requestURL: url, headers: {'Content-Length': length}})
        .catch(err => {
          console.error(`${err.message} ${err.stack}`);
          return null;
        });
      }));
    })
    .then(results => {
      if (results.includes(null)) {
        return new Error('Some chunks failed');
      }
      return api.put(`/v2/assets/${embedCode}/upload_status`, {}, {status: 'uploaded'});
    })
    .then(() => {
      console.log(`All chunks (total bytes=${buf.length}) sent. embed_code="${embedCode}"`);
    });
  });
}

module.exports = uploadFiles;
