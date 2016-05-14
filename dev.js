/*

Compile and run server, recompiling and restarting on changes.

Compile client and recompile on changes.

*/

var webpack = require('webpack')
var path = require('path')
var fs = require('fs')
var forever = require('forever-monitor')
var rm = require('rimraf')

var buildDir = path.join(__dirname, 'build')
var buildDirServer = path.join(buildDir, 'server')
var buildDirClient = path.join(buildDir, 'client')
var modulesDir = path.join(__dirname, 'modules')

var jsLoader = {
  test: /\.jsx?$/,
  exclude: /node_modules/,
  loader: 'babel',
  query: {
    presets: ['es2015', 'stage-0', 'react']
  }
}

var jsonLoader = { test: /\.json$/, loader: 'json-loader' }

var webpackStatsConfig = {
  colors: true,
  hash: false,
  version: false,
  timings: true,
  assets: false,
  chunks: false,
  chunkModules: false,
  modules: false,
  cached: false,
  reasons: false,
  source: true,
  errorDetails: true,
  chunkOrigins: false
}

// Build list of node modules that webpack should avoid compiling.
var nodeModules = fs
  .readdirSync('node_modules')
  .filter(function(x) { return x !== ".bin" })
  .reduce(function(memo, mod) {
    memo[mod] = 'commonjs ' + mod
    return memo
  }, {})

var serverConfig = {
  entry: [
    './server.js'
  ],
  resolve: {
    root: modulesDir,
    extensions: ['', '.js', '.jsx', '.json']
  },
  module: {
    loaders: [jsLoader, jsonLoader]
  },
  target: 'node',
  output: {
    path: buildDirServer,
    filename: 'server.js'
  },
  devtool: 'eval',
  node: {
    __dirname: true,
    __filename: true
  },
  externals: nodeModules,
  // Needed to keep persistent ids of modules and chunks for HMR.
  recordsPath: path.join(buildDirServer, '_records'),
  plugins: [
    // Adds source map support to node.
    new webpack.BannerPlugin(
      'require("source-map-support").install();',
      {raw: true}
    ),
    new webpack.HotModuleReplacementPlugin({ quiet: true })
  ]
}

var server = null
function startServer() {
  if (!server) {
    // Start server process using forever.
    server = new (forever.Monitor)(path.join(buildDirServer, 'server.js'))
    server.start()
  }
}

var clientConfig = {
  entry: [
    './client.js'
  ],
  resolve: {
    root: modulesDir,
    extensions: ['', '.js', '.jsx', '.json']
  },
  module: {
    loaders: [jsLoader, jsonLoader]
  },
  target: 'web',
  output: {
    path: buildDirClient,
    publicPath: '/_client/',
    filename: 'client.js'
  },
  devtool: 'eval',
  // Needed to keep persistent ids of modules and chunks for HMR.
  // Do we need this for the client?
  recordsPath: path.join(buildDirClient, '_records'),
  plugins: [
    new webpack.HotModuleReplacementPlugin({ quiet: true })
  ]
}

// Start build.

// Clear the build dir.
rm.sync(path.join(buildDir, '*'))

// Build & watch server
var serverCompiler = webpack(serverConfig)

serverCompiler.watch({}, function(err, stats) {
  if (err) {
    console.log('Error', err)
    return
  }

  console.log('[Server] ' + stats.toString(webpackStatsConfig))

  startServer()
})

// Build & watch client
var clientCompiler = webpack(clientConfig)
clientCompiler.watch({}, function(err, stats) {
  if (err) {
    console.log('Error', err)
    return
  }

  console.log('[Client] ' + stats.toString(webpackStatsConfig))
})
