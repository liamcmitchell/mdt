import io from 'socket.io-client'
import render from 'client/render'

render(document.getElementById('render-target'), require('./client-source').default)

if (module.hot) {
  // Allow self to reload if self or uncaught dependencies update.
  module.hot.accept('./client-source', () => {
    render(document.getElementById('render-target'), require('./client-source').default)
  })

  // Update on code change.
  // Based on webpack/hot/dev-server.js
  io(document.location.origin).on('client updated', () => {
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
