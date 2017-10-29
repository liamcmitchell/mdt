/* eslint-env node */
const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: [
    'babel-polyfill',
    'app'
  ],
  target: 'web',
  resolve: {
    // https://github.com/babel/babel-loader/issues/149#issuecomment-278462040
    symlinks: false,
    modules: [
      path.join(__dirname, 'modules'),
      'node_modules'
    ],
    extensions: ['.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        use: {
          loader: 'babel-loader',
        }
      }
    ]
  },
  output: {
    path: path.join(__dirname, 'build'),
    publicPath: '/',
    filename: 'app.js',
  },
  devtool: 'eval-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    watchContentBase: true,
    historyApiFallback: true,
    hot: true,
    compress: true,
    port: 8080
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
  stats: false,
}
