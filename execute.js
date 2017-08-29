const OoyalaApi = require('./lib');

module.exports = function (config, arg) {
  const api = new OoyalaApi(config.key, config.secret, {expirationTime: arg.expiration || config.period, concurrency: 6});
  return require(`./command/${arg._[0]}`)(api, arg._.slice(1), arg);
};
