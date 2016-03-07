/*
A URL can be string beginning with / or array of url pieces:
data('/user/login')
data(['user', 'login'])

Multiple URLs are supported as an array or map:
data(['/user', '/user/login'])
data({
  user: '/user',
  userLogin: '/user/login'
})

data(url) -> observable
data(url).map(fn) -> observable
data(url).render(fn) -> react component
data(url).set(val) -> promise
data(url).call(request) -> promise
*/

import createRouter from './createRouter'
import _ from 'underscore'
import Rx from 'rx'
import urlToString from './url-to-string'
import urlToArray from './url-to-array'

const isObservable = Rx.Observable.isObservable

function normalizeUrls(urls) {
  urls = isUrl(urls) ? [urls] : urls
  return _.isArray(urls) ?
    urls.map(normalizeUrl) :
    _.mapObject(normalizeUrl)
}

function normalizeUrl(url) {
  // Allow ready made observables alongside urls.
  return isObservable(url) ?
    url :
    urlToArray(url)
}

// Url can be string beginning with / or array of url pieces.
function isUrl(url) {
  return _.isString(url) && url[0] === '/' ||
    _.isArray(url) && _.isString(url[0])
}

function observe(router, url) {
  return isObservable(url) ?
    url :
    router({
      url: url,
      method: 'OBSERVE'
    })
}

function isSingleUrl(urls) {
  return _.isArray(urls) && urls.length === 1
}

function singleUrl(urls) {
  if (!isSingleUrl(urls)) {
    throw new Error('Requires single url')
  }
  return urls[0]
}

// External API

// Build the data function from given sources.
export default function createDataSource(sources) {
  const router = createRouter(sources)

  const data = function(urls) {
    return new Data(router, urls)
  }

  return data
}

function Data(router, urls) {
  this.urls = normalizeUrls(urls)
  this.router = router
}

Data.prototype.observable = function() {
  if (isSingleUrl(this.urls)) {
    // url -> val
    return observe(this.router, singleUrl(this.urls))
  }
  else if (_.isArray(this.urls)) {
    // [url, url] -> [val, val]
    return Rx.Observable.combineLatest(this.urls.map(observe.bind(null, this.router)))
  }
  else {
    // {k1: url, k2: url} -> {k1: val, k2: val}
    const keys = _.keys(this.urls)
    return Rx.Observable.combineLatest(
      _.values(this.urls).map(observe.bind(null, this.router))
    )
      .map(values => _.object(keys, values))
  }
}

Data.prototype.map = function(fn) {
  return this.observable().map(fn)
}

Data.prototype.subscribe = function() {
  const o = this.observable()
  return o.subscribe.apply(o, arguments)
}

Data.prototype.set = function(value) {
  return this.router({
    url: singleUrl(this.urls),
    method: 'SET',
    value: value
  })
}

Data.prototype.call = function(req) {
  if (!req.method) {
    throw new Error('Method name is required')
  }

  return this.router(Object.assign(req, {
    url: singleUrl(this.urls)
  }))
}
