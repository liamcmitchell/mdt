import chokidar from 'chokidar'
import express from 'express'
import bodyParser from 'body-parser'
import fs from 'fs'
import socketIO from 'socket.io'
import {createIO} from 'url-io'
import source from 'source/server'

let io = createIO(source)

const httpServer = express()
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
      const {method, value} = req.body

      if (method === 'OBSERVE' || method === 'GET') {
        res.status(400).json({error: 'OBSERVE and GET not allowed in POST'})
      }

      io(req.url, method, {value})
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
  // All other requests should return HTML to load the client.
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
  .listen(8080)

const websocketServer = socketIO(httpServer)

websocketServer.on('connection', function (socket) {
  // Store all subscriptions on the socket.
  socket.subscriptions = {}

  socket.on('error', error => {
    console.error(error.message, '\n', error.stack)
  })

  // Update subscriptions.
  socket.on('subscriptions', subscriptions => {
    // Add.
    subscriptions.forEach(path => {
      if (!socket.subscriptions[path]) {
        socket.subscriptions[path] = io(path).subscribe(d => {
          socket.emit('data', {path, data: d})
        })
      }
    })
    // Remove.
    Object.keys(socket.subscriptions).forEach(path => {
      if (subscriptions.indexOf(path) === -1) {
        socket.subscriptions[path].unsubscribe()
        delete socket.subscriptions[path]
      }
    })
  })

  // Clean up on disconnect.
  socket.on('disconnect', () => {
    for (var path in socket.subscriptions) {
      socket.subscriptions[path].unsubscribe()
    }
  })
})

if (module.hot) {
  // If server is hot-reloading, we assume the client is too.
  // Let client know that code has updated.
  // TODO: Use websockets to connect to compiler?
  chokidar.watch('build/client/client.js').on('change', () => {
    websocketServer.emit('client updated')
  })

  // Allow reload on source change.
  module.hot.accept('source/server', () => {
    io = createIO(require('source/server').default)

    // Replace all subscriptions
    websocketServer.sockets.sockets.forEach(socket => {
      socket.subscriptions.forEach(path => {
        const old = socket.subscriptions[path]
        socket.subscriptions[path] = io(path).subscribe(d => {
          socket.emit('data', {path, data: d})
        })
        old.unsubscribe()
      })
    })
  })

  // Watch and react to changes to self.
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
