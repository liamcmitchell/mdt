var webpack = require('webpack');
var path = require('path');

var babelSettings = { stage: 0 };

// Enables hot module reload in dev.
if (process.env.NODE_ENV !== 'production') {
  babelSettings.plugins = ['react-transform'];
  babelSettings.extra = {
    'react-transform': {
      transforms: [{
        transform: 'react-transform-hmr',
        imports: ['react'],
        locals: ['module']
      }]
    }
  };
}

module.exports = {
  entry: './entry',
  externals: {
    // Provided by Meteor.
    'meteor': 'Meteor',
    'react': 'React',
    'underscore': '_'
  },
  resolve: {
    root: path.join(__dirname, '..', 'modules'),
    extensions: ['', '.js', '.jsx', '.json']
  },
  module: {
    loaders: [
      { test: /\.jsx?$/, loader: 'babel', query: babelSettings, exclude: /node_modules/ }
    ]
  }
};
