import socketIO from 'socket.io-client/socket.io'
import {methods, wrap, cache} from 'url-io'
import axios from 'axios'
import memoize from 'lodash/memoize'
import debounce from 'lodash/debounce'
import {fromEvent} from 'rxjs/observable/fromEvent'
import {filter} from 'rxjs/operator/filter'
import {pluck} from 'rxjs/operator/pluck'
import {_finally} from 'rxjs/operator/finally'

// Cache remotes for seamless source reloading in dev.
export default memoize(remoteUrl =>
  wrap(
    cache(),
    remote(remoteUrl)
  )
)

// Relays requests via websockets for observables and REST for all
// others.
function remote(remoteUrl) {
  const subscriptions = {}
  const websocketClient = socketIO(remoteUrl)
  // Maintain a list of urls we are subscribed to on the server.
  const updateSubscriptions = debounce(() => {
    websocketClient.emit('subscriptions', Object.keys(subscriptions))
  })
  websocketClient.on('connect', updateSubscriptions)

  return methods({
    OBSERVE: ({path}) => {
      // No subscription count, we rely on being cached.
      subscriptions[path] = true
      updateSubscriptions()

      return fromEvent(websocketClient, 'data')
        ::filter(data => data.path === path)
        ::pluck('data')
        ::_finally(() => {
          delete subscriptions[path]
          updateSubscriptions()
        })
    },
    default: function({path, method, params: {value}}) {
      return axios({
        url: remoteUrl + '/data' + path,
        method: method === 'GET' ? 'GET' : 'POST',
        data: method === 'GET' ? undefined : {
          method: method,
          value: value
        }
      })
        .then(({data}) => data)
    }
  })
}
