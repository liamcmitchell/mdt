/* eslint-env node */
const path = require('path')
const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = ({prod} = {}) => ({
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
  devtool: !prod && 'eval-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    watchContentBase: true,
    historyApiFallback: {
      disableDotRule: true,
    },
    hot: true,
    compress: true,
    port: 8080,
    stats: 'errors-only',
  },
  plugins: [
    !prod && new webpack.HotModuleReplacementPlugin(),
    prod && new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    prod && new UglifyJsPlugin({
      uglifyOptions: {
        output: {
          semicolons: false, // Use newlines instead of semicolons to reduce git change size.
        },
      },
    }),
  ].filter(Boolean),
})
