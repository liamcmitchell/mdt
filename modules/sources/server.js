import Rx from 'rx'
import io from 'socket.io-client'

var websocketClient = io(document.location.origin)

// Store for all client subscriptions.
var subscriptions = {}

function updateSubscriptions() {
  websocketClient.emit('subscriptions', Object.keys(subscriptions))
}

websocketClient.on('connect', () => {
  updateSubscriptions()
})

var serverData = Rx.Observable.fromEvent(websocketClient, 'data')

// Returns observable of server data.
function observable(url) {
  return Rx.Observable.create(observer => {
    // Create subscription for this url if it doesn't exist.
    if (!subscriptions[url]) {
      subscriptions[url] = {
        subscribers: 0
      }
      updateSubscriptions()
    }

    var subscription = subscriptions[url]

    subscription.subscribers++

    // If there is an existing value, push that immediately.
    if (subscription.hasOwnProperty('lastValue')) {
      observer.onNext(subscription.lastValue)
    }

    // Connect to data source.
    var serverDataSubscription = serverData
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
        delete subscriptions[url]
        updateSubscriptions()
      }
    }
  })
}

export default {
  handle: function(request) {
    if (request.method === 'OBSERVABLE') {
      return observable(request.url)
    }
    else {
      throw new Error('Method not supported.', request)
    }
  }
}

