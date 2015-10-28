var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: './entry',
  externals: {
    // React is provided by Meteor.
    'react': 'React'
  },
  resolve: {
    root: path.join(__dirname, '..', 'modules'),
    extensions: ['', '.js', '.jsx', '.json']
  },
  module: {
    loaders: [
      { test: /\.jsx?$/, loader: 'babel', query: { stage: 0 }, exclude: /node_modules/ }
    ]
  }
};
