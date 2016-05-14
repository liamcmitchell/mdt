import serve from 'server/serve'
import chokidar from 'chokidar'
import Rx from 'rx'

const source$ = new Rx.BehaviorSubject(require('server-data').default)

serve(source$)

if (module.hot) {
  // Allow app to reload on source change.
  module.hot.accept('server-data', () => {
    source$.onNext(require('server-data').default)
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
