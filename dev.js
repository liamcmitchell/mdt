var webpack = require('webpack')
var path = require('path')
var fs = require('fs')
var nodemon = require('nodemon')

var buildDir = path.join(__dirname, "build")

var started = false

// Clear the build dir.
fs.readdirSync(buildDir)
  .map(function(file) { return path.join(buildDir, file) })
  .forEach(fs.unlinkSync)

// Build list of node modules that webpack should avoid compiling.
var nodeModules = fs
  .readdirSync('node_modules')
  .filter(function(x) { return x !== ".bin" })
  .reduce(function(memo, mod) {
    memo[mod] = 'commonjs ' + mod
    return memo
  }, {})

var backendConfig = {
  entry: [
    // This adds code to trigger HMR on receiving SIGUSR2 signal
    // (used by nodemon.restart).
    'webpack/hot/signal.js',
    './server.js'
  ],
  resolve: {
    root: path.join(__dirname, 'modules'),
    extensions: ['', '.js', '.jsx', '.json']
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loaders: ['babel?presets[]=es2015,presets[]=react']
    }]
  },
  target: 'node',
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'server.js'
  },
  devtool: "source-map",
  node: {
    __dirname: true,
    __filename: true
  },
  externals: nodeModules,
  // Needed to keep persistent ids of modules and chunks for HMR.
  recordsPath: path.join(__dirname, 'build/_records'),
  plugins: [
    // Adds source map support to node.
    new webpack.BannerPlugin(
      'require("source-map-support").install();',
      {raw: true}
    ),
    new webpack.HotModuleReplacementPlugin({ quiet: true })
  ]
}

webpack(backendConfig).watch({}, function(err, stats) {
  if (err) {
    console.log('Error', err)
    return
  }

  console.log(stats.toString({
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
  }))

  if (!started) {
    // Start server process using nodemon.
    // This allows 
    nodemon({
      execMap: {
        js: 'node'
      },
      script: path.join(__dirname, 'build/server'),
      ignore: ['*'],
      watch: ['foo/'],
      ext: 'noop'
    })
    started = true
  }
  else {
    nodemon.restart()
  }
})