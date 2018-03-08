const path = require('path');
const debug = require('debug');
const utils = require('../utils');

const print = debug('oo');
const MAX_OPEN_FILE_NUM = 1024;

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
  const {profile} = argv;
  const errors = [];
  return Promise.all(params.map((file, i) => {
    if (utils.isFile(file) === false) {
      utils.THROW(new Error(`Invalid path: ${file}`));
    }
    const totalSize = utils.getFileSize(file);
    let chunkSize = Math.min(argv.chunkSize || 204800, totalSize);
    if (Math.ceil(totalSize / chunkSize) >= MAX_OPEN_FILE_NUM) {
      chunkSize = Math.ceil(totalSize / MAX_OPEN_FILE_NUM);
    }
    const fileName = path.basename(file);
    const title = getTitle(argv, fileName, i);
    return uploadFile(api, file, title, fileName, chunkSize, totalSize, profile)
      .catch(err => {
        errors.push(err);
        return null;
      });
  })).then(results => {
    if (results.includes(null)) {
      return [
        errors.map(err => {
          return `Error: ${err.message} ${err.stack}`;
        }).join('\n'),
        results.join('\n')
      ].join('\n');
    }
    return results.join('\n');
  });
}

function uploadFile(api, file, title, fileName, chunkSize, totalSize, profile) {
  print(`upload: path='${file}' chunkSize='${chunkSize}' totalSize=${totalSize} title='${title}'`);
  const errors = [];
  let embedCode;
  return api.post('/v2/assets', {}, {
    name: title,
    file_name: fileName,
    asset_type: 'video',
    file_size: totalSize,
    chunk_size: chunkSize
  }).then(result => {
    embedCode = result.embed_code;
    return api.get(`/v2/assets/${embedCode}/uploading_urls`);
  }).then(result => {
    return Promise.all(result.map((url, i) => {
      const offset = chunkSize * i;
      const length = Math.min(chunkSize, totalSize - offset);
      return utils.readFile(file, offset, length)
        .then(buf => {
          print(`[PUT] offset=${offset} length=${length} ${url}`);
          return api.put(null, {}, buf, {requestURL: url, headers: {'Content-Length': length}});
        }).catch(err => {
          errors.push(err);
          return null;
        });
    }));
  }).then(results => {
    if (results.includes(null)) {
      utils.THROW(new Error(errors.map(err => {
        return `Error: ${err.message} ${err.stack}`;
      }).join('\n')));
    }
    if (profile) {
      return api.post(`/v2/assets/${embedCode}/process`, {}, {initiation_type: 'original_ingest', processing_profile_id: profile});
    }
    return api.put(`/v2/assets/${embedCode}/upload_status`, {}, {status: 'uploaded'});
  }).then(() => {
    return `Success: ${file} (total bytes=${totalSize}) embed_code="${embedCode}"`;
  });
}

module.exports = uploadFiles;
