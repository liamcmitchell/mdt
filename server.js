/* globals __resourceQuery */
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const io = require('socket.io')
const chokidar = require('chokidar')
const Rx = require('rx')
const data = require('server-data').default

// Using ES6 modules so we need to get default export.
let app = require('server-app').default

const server = express()
  // Serve compiled client assets.
  // TODO: Pass through to compiler in dev mode?
  .use('/_client', express.static('build/client'))
  // Serve static assets.
  .use('/_public', express.static('public'))
  // Populate req.body for application/json.
  .use(bodyParser.json())
  // Serve data requests.
  .use('/data', function(req, res, next) {

    if (req.method === 'POST') {
      const method = req.body.method

      if (method === 'OBSERVE' || method === 'GET') {
        res.status(400).json({error: 'OBSERVE and GET not allowed in POST'})
      }

      data(req.url).call({
        method: method,
        value: req.body.value
      })
      .then(result => {
        res.json(result)
      }, err => {
        res.status(500).json(err)
      })

    }
    else {
      next()
    }
  })
  // All other requests should have the index.html returned.
  .use((req, res) => {
    fs.readFile('public/index.html', (err, data) => {
      if (err) {
        res.writeHead(500)
        return res.end('Error loading index.html')
      }
      res.writeHead(200)
      res.end(data)
    })
  })
  .listen(3000)

var websocketServer = io(server)

websocketServer.on('connection', function (socket) {
  // Store all subscriptions on the socket.
  socket.subscriptions = {}

  socket.on('error', error => {
    console.error(error.message, '\n', error.stack)
  })

  // Update subscriptions.
  socket.on('subscriptions', subscriptions => {
    // Add.
    subscriptions.forEach(url => {
      if (!socket.subscriptions[url]) {
        socket.subscriptions[url] = data(url).subscribe(d => {
          socket.emit('data', {url: url, data: d})
        })
      }
    })
    // Remove.
    Object.keys(socket.subscriptions).forEach(url => {
      if (subscriptions.indexOf(url) === -1) {
        socket.subscriptions[url].dispose()
        delete socket.subscriptions[url]
      }
    })
  })

  // Clean up on disconnect.
  socket.on('disconnect', () => {
    for (var url in socket.subscriptions) {
      socket.subscriptions[url].dispose()
    }
  })
})



if (module.hot) {
  // Allow app to reload.
  module.hot.accept('server-app', () => {
    app = require('server-app').default
  })

  // Let client know that code has updated.
  // TODO: Use websockets to connect to compiler?
  chokidar.watch('build/client/client.js').on('change', () => {
      websocketServer.emit('client updated')
    })

  // Update on code change.
  // Based on webpack/hot/signal.js
  chokidar.watch('build/server/server.js').on('change', () => {
    if (module.hot.status() !== "idle") {
      console.warn("[HMR] Got signal but currently in " + module.hot.status() + " state.")
      console.warn("[HMR] Need to be in idle state to start hot update.")
      return
    }

    module.hot.check(true, function(error, disposedModules) {
      var status = module.hot.status()
      if (error && (status === 'abort' || status === 'fail')) {
        console.log('Unable to hot reload, restarting.')
        // Relies on process being restarted by parent.
        process.exit(1)
      }
      else if (error) {
        console.error('Hot reload failed.', error)
      }
      else if (disposedModules === null) {
        console.log('No update found.')
      }
      else {
        console.log('Reloaded.')
      }
    })
  })
}
