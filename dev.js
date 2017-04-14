/*

Compile and run server, recompiling and restarting on changes.

Compile client and recompile on changes.

*/

var webpack = require('webpack')
var path = require('path')
var forever = require('forever-monitor')
var rm = require('rimraf')
var serverConfig = require('./webpack.server.config')
var clientConfig = require('./webpack.client.config')

var buildDir = path.join(__dirname, 'build')
var buildDirServer = path.join(buildDir, 'server')

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

var server = null
function startServer() {
  if (!server) {
    // Start server process using forever.
    server = new (forever.Monitor)(path.join(buildDirServer, 'server.js'))
    server.start()
  }
}


// Start build.

// Clear the build dir.
rm.sync(path.join(buildDir, '*'))

// Build & watch server
var serverCompiler = webpack(Object.assign({}, serverConfig, {
  devtool: 'eval',
  // Needed to keep persistent ids of modules and chunks for HMR.
  recordsPath: path.join(serverConfig.output.path, '_records'),
  plugins: [
    // Adds source map support to node.
    new webpack.BannerPlugin(
      'require("source-map-support").install();',
      {raw: true}
    ),
    new webpack.HotModuleReplacementPlugin({ quiet: true })
  ]
}))

serverCompiler.watch({}, function(err, stats) {
  if (err) {
    console.log('Error', err)
    return
  }

  console.log('[Server] ' + stats.toString(webpackStatsConfig))

  startServer()
})

// Build & watch client
var clientCompiler = webpack(Object.assign({}, clientConfig, {
  devtool: 'eval',
  // Needed to keep persistent ids of modules and chunks for HMR.
  // Do we need this for the client?
  recordsPath: path.join(clientConfig.output.path, '_records'),
  plugins: [
    new webpack.HotModuleReplacementPlugin({ quiet: true })
  ]
}))
clientCompiler.watch({}, function(err, stats) {
  if (err) {
    console.log('Error', err)
    return
  }

  console.log('[Client] ' + stats.toString(webpackStatsConfig))
})
