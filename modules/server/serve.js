import express from 'express'
import bodyParser from 'body-parser'
import fs from 'fs'
import io from 'socket.io'
import chokidar from 'chokidar'
import Rx from 'rx'

// Serve a source.
// TODO: Pass in client as observable too.
export default function serve(source$) {
  source$ = Rx.Observable.isObservable(source$) ?
    source$ :
    Rx.Observable.just(source$)

  // To be replaced by observable.
  let source = () => { throw new Error('Source not ready') }

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
        const method = req.body.method

        if (method === 'OBSERVE' || method === 'GET') {
          res.status(400).json({error: 'OBSERVE and GET not allowed in POST'})
        }

        source(req.url).call({
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
    .listen(3000)

  var websocketServer = io(httpServer)

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
          socket.subscriptions[url] = source(url).subscribe(d => {
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

  source$.subscribe(s => {
    source = s

    // Replace all subscriptions
    websocketServer.sockets.sockets.forEach(socket => {
      socket.subscriptions.forEach(url => {
        const old = socket.subscriptions[url]
        socket.subscriptions[url] = source(url).subscribe(d => {
          socket.emit('data', {url: url, data: d})
        })
        old.dispose()
      })
    })
  })

  // If server is hot-reloading, we assume the client is too.
  if (module.hot) {
    // Let client know that code has updated.
    // TODO: Use websockets to connect to compiler?
    chokidar.watch('build/client/client.js').on('change', () => {
      websocketServer.emit('client updated')
    })
  }
}
