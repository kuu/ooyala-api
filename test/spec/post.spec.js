import OoyalaApi from 'ooyala-api';
import config from 'config';

describe('POST/PATCH/DELETE', () => {

  let api, embedCode;

  beforeEach(() => {
    api = new OoyalaApi(config.api.key, config.api.secret);
  });

  const FLASH_URL = 'http://flash_url.com';

  it('should be able to create an asset', (cb) => {
    api.post('/v2/assets', {}, {
      name: `test ${Date()}`,
      asset_type: 'remote_asset',
      is_live_stream: true,
      stream_urls: {
        'flash': FLASH_URL,
        'iphone': 'http://iphone_url.com'
      }
    }).then((result) => {
      //console.log(result);
      embedCode = result['embed_code'];
      expect(result).not.toBe(null);
      cb();
    });
  });

  it('should be able to get the asset', (cb) => {
    api.get(`/v2/assets/${embedCode}`)
    .then((result) => {
      //console.log(result);
      expect(result).not.toBe(null);
      expect(result['stream_urls'].flash).toBe(FLASH_URL);
      cb();
    });
  });
/* TODO
  const NEW_FLASH_URL = 'http://fresh_url.com';

  it('should be able to update the asset', (cb) => {
    api.patch(`/v2/assets/${embedCode}`, {}, {
      stream_urls: {
        'flash': NEW_FLASH_URL
      }
    }).then((result) => {
      //console.log(result);
      expect(result).not.toBe(null);
      expect(result['stream_urls'].flash).toBe(NEW_FLASH_URL);
      cb();
    });
  });
*/
  it('should be able to delete the asset', (cb) => {
    api.delete(`/v2/assets/${embedCode}`)
    .then((result) => {
      //console.log(result);
      expect(result).not.toBe(null);
      cb();
    });
  });
});
