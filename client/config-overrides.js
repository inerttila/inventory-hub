const { override, addWebpackResolve, addWebpackPlugin } = require('customize-cra');
const webpack = require('webpack');

module.exports = override(
  addWebpackResolve({
    fallback: {
      "buffer": require.resolve("buffer/"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "util": require.resolve("util/"),
      "process": require.resolve("process/browser.js"),
      "vm": require.resolve("vm-browserify"),
    },
  }),
  addWebpackPlugin(
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    })
  )
);

