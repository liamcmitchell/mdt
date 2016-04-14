import Rx from 'rx'
import urlToString from './url-to-string'

// Return an observable from the cache, using last value if available.
function getCachedObservable(cache, url) {
  const cached = cache[url]
  if (cached.hasOwnProperty('lastValue')) {
    return cached.observable.startWith(cached.lastValue)
  }
  else {
    return cached.observable
  }
}

// We create a cacheable observable because we don't want to add it to
// the cache until subscription.
function createCacheableObservable(source, cache, request) {
  const url = urlToString(request.url)

  return Rx.Observable.create(observer => {
    // If there is still nothing in cache, add it.
    if (!cache[url]) {
      cache[url] = {
        observable: createCachedObservable(source, cache, request)
      }
    }

    // Use the cached observable.
    return getCachedObservable(cache, url).subscribe(observer)
  })
}

// This creates the observable that will live in the cache.
function createCachedObservable(source, cache, request) {
  const url = urlToString(request.url)

  return source(request)
    // Allow cache users to start with the latest value.
    .tap(v => cache[url].lastValue = v)
    // Remove from cache when disposed.
    .finally(() => delete cache[url])
    // Share single observable.
    .publish().refCount()
}

export default function sourceCache(source) {
  const cache = {}

  return function(request) {
    if (request.method === 'OBSERVE') {
      const url = urlToString(request.url)

      if (cache[url]) {
        return getCachedObservable(cache, url)
      }
      else {
        // Here the request isn't completed until subscription.
        return createCacheableObservable(source, cache, request)
      }
    }
    else {
      return source(request)
    }
  }
}
