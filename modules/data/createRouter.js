import _ from 'underscore'

function normalizeRoutes(routes) {
  Object.keys(routes).forEach(route => {
    if (route.indexOf('/') !== -1) {
      throw new Error('Route cannot contain /')
    }
    if (typeof routes[route] !== 'function') {
      throw new Error('Route handler must be a function')
    }
  })
  return routes
}

// Thrown when handler is not found.
// TODO: Is a new error type needed?
function NoHandlerError(message) {
  this.name = 'NoHandlerError'
  this.message = message || 'No handler found for route.'
  this.stack = (new Error()).stack
}
NoHandlerError.prototype = Object.create(Error.prototype)
NoHandlerError.prototype.constructor = NoHandlerError

function handle(routes, request) {
  const currentPart = request.url[0]
  const nextUrl = request.url.slice(1)
  const nextRequest = Object.assign({}, request, {url: nextUrl})

  if (routes.hasOwnProperty(currentPart)) {
    return routes[currentPart].call(null, nextRequest)
  }
  else {
    throw new NoHandlerError('No handler found for route ' + currentPart)
  }
}

// A router is a handler that sends requests to handlers based on url.
export default function createRouter(routes) {
  return handle.bind(null, normalizeRoutes(routes))
}
