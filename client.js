import React from 'react'
import ReactDOM from 'react-dom'
import App from 'components/app'

function render() {
  ReactDOM.render(
    <App io={require('./client-source').default} />,
    document.getElementById('render-target')
  )
}

render()

if (module.hot) {
  // Allow self to reload if self or uncaught dependencies update.
  module.hot.accept('./client-source', render)

  // Update on code change.
  // Based on webpack/hot/dev-server.js
  require('socket.io-client')(document.location.origin).on('client updated', () => {
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
