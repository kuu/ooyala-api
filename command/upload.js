const fs = require('fs');
const path = require('path');
const debug = require('debug');
const constants = require('../constants');

const print = debug('oo');
const baseDir = path.join(__dirname, '..');

function uploadFile(api, localPath, argv) {
  const absolutePath = path.join(baseDir, localPath);

  if (fs.statSync(absolutePath).isFile() === false) {
    console.info(constants.HELP_TEXT);
    return;
  }

  const fileName = path.basename(absolutePath);
  const chunkSize = argv.chunkSize || 204800;
  const title = (argv.title || fileName).replace(/['"]+/g, '');

  print(`upload: path='${localPath}' chunkSize='${chunkSize}' title='${title}'`);

  fs.readFile(absolutePath, (err, buf) => {
    if (err) {
      console.error(`${err.message} ${err.stack}`);
      return;
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
      console.log(`All chunks[${buf.length}] sent. embed_code="${embedCode}"`);
    });
  });
}

module.exports = uploadFile;
