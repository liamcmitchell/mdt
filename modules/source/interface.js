/*
A URL can be string beginning with / or array of url pieces:
source('/user/login')
source(['user', 'login'])

Multiple URLs are supported as an array or map:
source(['/user', '/user/login'])
source({
  user: '/user',
  userLogin: '/user/login'
})

source(url) -> observable
source(url).map(fn) -> observable
source(url).render(fn) -> react component
source(url).set(val) -> promise
source(url).call(request) -> promise
*/

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

function observe(source, url) {
  return isObservable(url) ?
    url :
    source({
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

// Top source fn
function entry(source, request) {
  if (!request.url || !_.isArray(request.url)) {
    throw new Error('Url must be an array')
  }
  if (!request.method || !_.isString(request.method)) {
    throw new Error('Method must be a string')
  }
  if (!request.source) {
    // Pass on source so endpoints can access other data.
    request.source = source
  }
  return source(request)
}

// External API

// Return dev friendly API for given source.
export default function sourceInterface(source) {
  if (typeof source !== 'function') {
    throw new Error('Source must be a function')
  }

  source = entry.bind(null, source)

  return function createSourceInterface(urls) {
    return new SourceInterface(source, urls)
  }
}

function SourceInterface(source, urls) {
  this.source = source
  this.urls = normalizeUrls(urls)
}

SourceInterface.prototype.observable = function() {
  if (isSingleUrl(this.urls)) {
    // url -> val
    return observe(this.source, singleUrl(this.urls))
  }
  else if (_.isArray(this.urls)) {
    // [url, url] -> [val, val]
    return Rx.Observable.combineLatest(this.urls.map(observe.bind(null, this.source)))
  }
  else {
    // {k1: url, k2: url} -> {k1: val, k2: val}
    const keys = _.keys(this.urls)
    return Rx.Observable.combineLatest(
      _.values(this.urls).map(observe.bind(null, this.source))
    )
      .map(values => _.object(keys, values))
  }
}

SourceInterface.prototype.map = function(fn) {
  return this.observable().map(fn)
}

SourceInterface.prototype.subscribe = function() {
  const o = this.observable()
  return o.subscribe.apply(o, arguments)
}

SourceInterface.prototype.set = function(value) {
  return this.source({
    url: singleUrl(this.urls),
    method: 'SET',
    value: value
  })
}

SourceInterface.prototype.call = function(req) {
  return this.source(Object.assign(req, {
    url: singleUrl(this.urls)
  }))
}
