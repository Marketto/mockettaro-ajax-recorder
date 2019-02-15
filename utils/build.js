const webpack = require("webpack");
const config = require("../webpack.config")({NODE_ENV: 'production'});
webpack(
  config,
  function (err) {
    if (err) {
      throw err;
    }
  }
);
