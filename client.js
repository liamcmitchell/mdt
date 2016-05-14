import React from 'react'
import ReactDOM from 'react-dom'
import io from 'socket.io-client'
import Rx from 'rx'

var websocketClient = io(document.location.origin)

function render() {
  ReactDOM.render(
    React.createElement(require('client-app').default, null),
    document.getElementById('render-target')
  )
}

render()

if (module.hot) {
  // Allow self to reload if self or uncaught dependencies update.
  module.hot.accept('client-app', render)

  // Update on code change.
  // Based on webpack/hot/dev-server.js
  websocketClient.on('client updated', () => {
    module.hot.check(true, (error, disposedModules) => {
      var status = module.hot.status()
      if (error && (status === 'abort' || status === 'fail')) {
        console.log('Unable to hot reload, reloading page.', error)
        window.location.reload()
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
