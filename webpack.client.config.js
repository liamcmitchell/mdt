var path = require('path')
var sharedConfig = require('./webpack.shared.config')

module.exports = Object.assign({}, sharedConfig, {
  entry: [
    'babel-polyfill',
    './client.js'
  ],
  target: 'web',
  node: {
    fs: 'empty',
    net: 'empty'
  },
  output: {
    path: path.join(__dirname, 'build', 'client'),
    publicPath: '/_client/',
    filename: 'client.js'
  }
})
