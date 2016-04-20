import Rx from 'rx'
import io from 'socket.io-client'
import sourceMethods from 'source/methods'
import urlToString from 'source/url-to-string'
import req from 'browser-request'

// Relays requests via websockets for observables and REST for all
// others.
export default function buildRemoteHandler(remoteUrl) {
  const subscriptions = {}
  const websocketClient = io(remoteUrl)
  // Maintain a list of urls we are subscribed to on the server.
  const updateSubscriptions = () =>
    websocketClient.emit('subscriptions', Object.keys(subscriptions))
  websocketClient.on('connect', updateSubscriptions)

  return sourceMethods({
    OBSERVE: (request, observer) => {
      const url = urlToString(request.url)

      // No subscription count, we rely on being cached by parent.
      subscriptions[url] = true
      updateSubscriptions()

      return Rx.Observable.fromEvent(websocketClient, 'data')
        .filter(data => data.url === url)
        .pluck('data')
        .finally(() => {
          delete subscriptions[url]
          updateSubscriptions()
        })
        .subscribe(observer)
    },
    // H
    default: function(request, promise) {
      req({
        // Uses /data endpoint on server.
        url: remoteUrl + '/data' + urlToString(request.url),
        method: request.method === 'GET' ? 'GET' : 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          method: request.method,
          value: request.value
        })
      }, (err, response, body) => {
        if (!err && response.statusCode === 200) {
          // Response should be JSON but also allow empty string.
          try {
            const val = body === '' ? null : JSON.parse(body)
            promise.resolve(val)
          } catch (e) {
            promise.reject(e)
          }
        }
        else if (err) {
          promise.reject(err)
        }
        else {
          const unexpectedResponse = new Error('Unexpected response')
          unexpectedResponse.response = response
          promise.reject(unexpectedResponse)
        }
      })
    }
  })
}
