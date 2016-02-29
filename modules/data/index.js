import createRouter from './createRouter'

// Top level API
export default function createDataSource(sources) {
  const route = createRouter(sources)

  const data = function(url) {
    return new Data(route, url)
  }

  data.observable = url => {
    return route({
      url: url,
      method: 'OBSERVE'
    })
  }

  data.set = (url, data) => {
    return route({
      url: url,
      method: 'SET',
      data: data
    })
  }

  data.call = req => {
    if (!req.method) {
      throw new Error('Method name is required')
    }

    return route(req)
  }

  return data
}

function Data(route, url) {
  this.url = url
  this.route = route
}

Data.prototype.observable = function() {
  return this.route({
    url: this.url,
    method: 'OBSERVE'
  })
}

Data.prototype.subscribe = function() {
  const o = this.observable()
  return o.subscribe.apply(o, arguments)
}

Data.prototype.set = function(data) {
  return this.route({
    url: this.url,
    method: 'SET',
    data: data
  })
}

Data.prototype.call = function(req) {
  if (!req.method) {
    throw new Error('Method name is required')
  }

  return this.route(Object.assign(req, {
    url: this.url
  }))
}
