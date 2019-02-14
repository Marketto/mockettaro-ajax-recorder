const webpack = require("webpack");
const path = require("path");
const fileSystem = require("fs");
const env = require("./utils/env");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WriteFilePlugin = require("write-file-webpack-plugin");
const svg2png = require("svg2png");
const Jimp = require('jimp');

// load the secrets
var alias = {};

var secretsPath = path.join(__dirname, ("secrets." + env.NODE_ENV + ".js"));

var fontsExtensions = ["eot", "otf", "svg", "ttf", "woff", "woff2"];
var imgExtensions = ["jpg", "jpeg", "png", "gif"];

if (fileSystem.existsSync(secretsPath)) {
  alias["secrets"] = secretsPath;
}

const srcPath = path.join(__dirname, "src");

var options = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    popup: path.join(srcPath, "popup", "popup.js"),
    options: path.join(srcPath, "opt", "options.js"),
    background: path.join(srcPath, "bg", "background.js"),
    menu: path.join(srcPath, "menu", "menu.js")
  },
  output: {
    path: path.join(__dirname, "build"),
    filename: "[name].bundle.js"
  },
  module: {
    rules: [
      {
        test: new RegExp('\.(' + fontsExtensions.join('|') + ')$'),
        use: [{
          loader: "file-loader",
          options: {
            name: '[name].[ext]'
          }
        }]
      },
      {
        test: /\.s?css$/,
        use: ["style-loader", "css-loader", "resolve-url-loader", "sass-loader"]
      },
      {
        test: new RegExp('\.(' + imgExtensions.join('|') + ')$'),
        use: [{
          loader: "file-loader",
          options: {
            name: '[name].[ext]',
            outputPath: 'img/',
            publicPath: '../'
          }
        }],
        exclude: /screenshots/
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    alias
  },
  plugins: [
    // clean the build folder
    new CleanWebpackPlugin(["build"]),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin(["NODE_ENV"]),
    new CopyWebpackPlugin([
    //  'src/icons',
      ...([16, 19, 48].map(size => ({
        from: "src/icon.svg",
        transform: content => svg2png.sync(Buffer.from(content), {height: size, width: size}),
        to: `icons/icon${size}.png`
      }))),
      {
        from: "src/icon.svg",
        transform: content => {
          return Promise.all([
            new Promise((resolve, reject) => new Jimp(128, 128, (err, image) => {
              if (err) {
                reject(err);
              } else {
                resolve(image);
              }
            })),
            svg2png(Buffer.from(content), {height: 96, width: 96}).then(png96Buf => Jimp.read(png96Buf))
          ]).then(([baseImg, png96Buf]) => baseImg.blit(png96Buf, 16, 16))
          .then(image => image.getBufferAsync(Jimp.MIME_PNG))
        },
        to: `icons/icon128.png`
      },
      {
        from: "src/_locales",
        transform: content => Buffer.from(JSON.stringify(JSON.parse(content.toString()))),
        to: '_locales'
      },
      {
        from: "src/manifest.json",
        transform: content => {
          const manifest = JSON.parse(content.toString());
          const htmlPathReplacer = (target) => {
            const strategies = {
              object: (t, k, v) => t[k] = htmlPathReplacer(v),
              string: (t, k, v) => {
                const matchReplacers = [
                  { //html
                    matcher: /[\\/]([^\\/]+\.(?:html?|png))$/i,
                    replacer: matched => matched[1] 
                  },
                  { //js
                    matcher: /[\\/]([^\\/]+)\.js$/i,
                    replacer: matched => `${matched[1]}.bundle.js`
                  }
                ];
                const matchReplacer = matchReplacers.find(({matcher}) => matcher.test(v));
                if (matchReplacer) {
                  t[k] = matchReplacer.replacer(v.match(matchReplacer.matcher));
                }
              }
            };
            Object.entries(target).forEach(([key, value]) => {
              const strategy = strategies[typeof value];
              if (strategy) {
                strategy(target, key, value);
              }
            });
            return target;
          };
          // generates the manifest file using the package.json informations
          return Buffer.from(JSON.stringify({
            ...htmlPathReplacer(manifest),
            version: process.env.npm_package_version
          }))
        }
      }
    ]),
    fileSystem.existsSync(path.join(srcPath, "popup", "popup.html")) && new HtmlWebpackPlugin({
      template: path.join(srcPath, "popup", "popup.html"),
      filename: "popup.html",
      chunks: ["popup"]
    }),
    fileSystem.existsSync(path.join(srcPath, "opt", "options.html")) && new HtmlWebpackPlugin({
      template: path.join(srcPath, "opt", "options.html"),
      filename: "options.html",
      chunks: ["options"]
    }),
    fileSystem.existsSync(path.join(srcPath, "bg", "background.html")) && new HtmlWebpackPlugin({
      template: path.join(srcPath, "bg", "background.html"),
      filename: "background.html",
      chunks: ["background"]
    }),
    fileSystem.existsSync(path.join(srcPath, "menu", "menu.html")) && new HtmlWebpackPlugin({
      template: path.join(srcPath, "menu", "menu.html"),
      filename: "menu.html",
      chunks: ["menu"]
    }),
    new WriteFilePlugin()
  ]
};

//purging config for missing files
options.entry = [{}, {}].concat(
    Object.entries(options.entry)
    .filter(([entry, path]) => fileSystem.existsSync(path))
    .map(([entry, path]) => ({[entry]: path}))
  ).reduce((a,b)=> Object.assign(a, b));

options.plugins = options.plugins.filter(plugin => !!plugin);

if (env.NODE_ENV === "development") {
  options.devtool = "cheap-module-eval-source-map";
}

module.exports = options;
