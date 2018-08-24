/**
 * If you want to run your dev server at a host different from 127.0.0.1:8080,
 * or to enable HTTPS, you'll need to set some environment variables. Example:
 *
 * npm start -- --env.WEBPACK_DEV_SERVER='192.168.50.1:8080' \
 *   --env.WEBPACK_DEV_HTTPS_KEY='/path/to/server.key' \
 *   --env.WEBPACK_DEV_HTTPS_CERT='/path/to/server.crt'
 *
 * You'll want to define WEBPACK_DEV_SERVER for your WordPress stack as well.
 */

const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

module.exports = env => {
  const config = {
    entry: {
      loader: './js/loader.js',
      admin: './js/admin.js'
    },
	devtool: 'cheap-module-source-map',
	plugins: [],
    externals: {
      jQuery: 'jQuery'
    },
    output: {
      filename: '[name].min.js',
      path: path.resolve(__dirname, 'static')
    }
  };

  if ('development' === env.NODE_ENV) {
    const serverHost = env.WEBPACK_DEV_SERVER ? env.WEBPACK_DEV_SERVER : '127.0.0.1:8080';

    config.devServer = {
      contentBase: './static',
      host: '0.0.0.0',
      hotOnly: true,
      inline: true,
      public: serverHost,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    };

    let protocol = 'http';
    if (env.WEBPACK_DEV_HTTPS_CERT && env.WEBPACK_DEV_HTTPS_KEY) {
      config.devServer.https = {
        cert: fs.readFileSync(
          env.WEBPACK_DEV_HTTPS_CERT,
          'utf8'
        ),
        key: fs.readFileSync(
          env.WEBPACK_DEV_HTTPS_KEY,
          'utf8'
        ),
      };

      protocol = 'https';
    }

    config.output.publicPath = `${protocol}://${serverHost}/`;

    config.plugins.push(new webpack.HotModuleReplacementPlugin());
  }

  return config;
};
