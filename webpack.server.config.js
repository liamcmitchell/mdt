var path = require('path')
var fs = require('fs')
var sharedConfig = require('./webpack.shared.config')

module.exports = Object.assign({}, sharedConfig, {
  entry: [
    'babel-polyfill',
    './server.js'
  ],
  target: 'node',
  output: {
    path: path.join(__dirname, 'build', 'server'),
    filename: 'server.js'
  },
  node: {
    __dirname: true,
    __filename: true
  },
  // Avoid compiling node modules.
  externals: fs
    .readdirSync('node_modules')
    .filter(function(x) { return x !== ".bin" })
    .reduce(function(memo, mod) {
      memo[mod] = 'commonjs ' + mod
      return memo
    }, {})
})
