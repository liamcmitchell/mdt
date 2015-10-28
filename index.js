var child_process = require('child_process')
var path = require('path')
var open = require('open')
var LineWrapper = require('stream-line-wrapper')

console.log('Starting Meteor')

// Create child process
var meteorChild = child_process.spawn('meteor', ['--port=1033'], {
  cwd: path.join(__dirname, 'meteor'),
  // Add local packages
  env: Object.assign({PACKAGE_DIRS: path.join(__dirname, 'packages')}, process.env)
})

// Pipe output with prefix
meteorChild.stdout.pipe(new LineWrapper({prefix: '[Meteor] '})).pipe(process.stdout)
meteorChild.stderr.pipe(new LineWrapper({prefix: '[Meteor] '})).pipe(process.stderr)

// Exit on error
meteorChild.on('error', function (error) {
  throw error
  process.exit(1)
})

// Log exit so we don't wonder why things have stopped
meteorChild.on('exit', function (code) {
  console.log('Meteor exited with code ' + code)
})
