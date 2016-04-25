import OoyalaApi from 'ooyala-api';
import config from 'config';

describe('GET', () => {

  let api;

  beforeEach(() => {
    api = new OoyalaApi(config.api.key, config.api.secret);
  });

  it('should be able to get assets of a specific label', (cb) => {
    api.get('/v2/assets', {where: `labels+INCLUDES+'Music'`}, {pagination: true})
    .then((results) => {
      //console.log(results);
      expect(results).not.toBe(null);
      expect(results.length).not.toBe(0);
      cb();
    }).catch((e) => {
      console.error('error occurred.:', e);
      cb();
    });
  });
});
