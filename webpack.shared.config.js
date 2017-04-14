var path = require('path')
var modulesDir = path.join(__dirname, 'modules')

var jsLoader = {
  test: /\.js?$/,
  exclude: /node_modules/,
  include: [path.resolve(__dirname)],
  loader: 'babel',
  query: {
    presets: ['es2015', 'stage-0', 'react']
  }
}

var jsonLoader = {
  test: /\.json$/,
  loader: 'json-loader'
}

module.exports = {
  resolve: {
    root: modulesDir,
    extensions: ['', '.js', '.json']
  },
  module: {
    loaders: [jsLoader, jsonLoader]
  }
}
