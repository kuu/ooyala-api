const debug = require('debug');
const utils = require('../utils');

const print = debug('oo');

function createRemoteAsset(api, params, argv) {
  if (params.length === 0) {
    utils.THROW(new Error('Asset name is not specified.'));
  }

  const name = utils.trimQuotes(params[0]);
  let {dash, hls, hds} = argv;

  if (!dash && !hls && !hds) {
    if (params.length > 1) {
      hls = params[1];
    } else {
      utils.THROW(new Error('No URL specified. Either dash or hls or hds should be specified.'));
    }
  }

  print(`createRemoteAsset("${name}", dash="${dash}", hls="${hls}, hds="${hds}")`);

  const urls = {};
  if (hds) {
    urls.flash = hds;
  }
  if (hls) {
    urls.iphone = hls;
  }

  if (!urls.flash) {
    urls.flash = dash || hls;
  }

  const assetData = {
    name,
    asset_type: 'remote_asset',
    is_live_stream: true,
    stream_urls: urls
  };

  return api.post('/v2/assets', {}, assetData)
  .then(result => {
    if (!result.embed_code) {
      utils.THROW(new Error('Failed to create a remote asset.'));
    }
    const urlData = {dash, hls, hds};
    return api.post(`/v2/assets/${result.embed_code}/movie_urls`, {}, urlData);
  });
}

module.exports = createRemoteAsset;
