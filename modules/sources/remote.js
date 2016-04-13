import Rx from 'rx'
import io from 'socket.io-client'
import sourceMethods from 'source/methods'
import urlToString from 'source/url-to-string'
import req from 'browser-request'

// TODO: Abstract out subscription manipulation and caching last value.
function createObserveHandler(remoteUrl) {
  const subscriptions = {}
  const websocketClient = io(remoteUrl)
  const serverData$ = Rx.Observable.fromEvent(websocketClient, 'data')

  function updateSubscriptions() {
    websocketClient.emit('subscriptions', Object.keys(subscriptions))
  }

  websocketClient.on('connect', updateSubscriptions)

  return function(request, observer) {
    const url = urlToString(request.url)

    // Create subscription for this url if it doesn't exist.
    if (!subscriptions[url]) {
      subscriptions[url] = {
        subscribers: 0
      }
      updateSubscriptions()
    }

    const subscription = subscriptions[url]

    subscription.subscribers++

    // If there is an existing value, push that immediately.
    if (subscription.hasOwnProperty('lastValue')) {
      observer.onNext(subscription.lastValue)
    }

    // Connect to data source.
    const serverDataSubscription = serverData$
      .filter(data => data.url === url)
      .pluck('data')
      .subscribe(data => {
        // Save last value so further subscriptions can have immediate value.
        subscription.lastValue = data
        observer.onNext(data)
      })

    // Return dispose function.
    return () => {
      serverDataSubscription.dispose()

      subscription.subscribers--

      // Sanity check.
      if (subscription.subscribers < 0) {
        throw new Error('Subscribers count below 0: ', subscription.subscribers)
      }

      // Clean up subscription.
      if (subscription.subscribers === 0) {
        // Defer in case we are resubscribing on next tick.
        setTimeout(() => {
          if (subscription.subscribers === 0) {
            delete subscriptions[url]
            updateSubscriptions()
          }
        })
      }
    }
  }
}

// For connecting to MDT compatible APIs.
export default function buildRemoteHandler(remoteUrl) {
  return sourceMethods({
    OBSERVE: createObserveHandler(remoteUrl),
    default: function(request, promise) {
      req({
        // TODO: Should /data be added here? In parent? Do we need it?
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
