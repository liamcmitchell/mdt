/* global Package */

Package.describe({
  name: 'liamcmitchell:mdt',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'MDT yo',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/liamcmitchell/mdt',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
})

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1')
  api.use('isobuild:compiler-plugin@1.0.0')
  api.use('ecmascript')
  api.addFiles('mdt-errors.js')
  api.addFiles('mdt-router.js')
  api.addFiles('mdt.js')
  api.export('MDT')
})

Package.onTest(function(api) {
  api.use('ecmascript')
  api.use('tinytest')
  api.use('liamcmitchell:mdt')
  api.addFiles('mdt-tests.js')
})

Package.registerBuildPlugin({
  name: 'MDT',
  use: [],
  sources: ['build-plugin.js'],
  npmDependencies: {}
})
