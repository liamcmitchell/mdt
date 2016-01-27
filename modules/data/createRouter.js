function validateRoutes(routes) {
  Object.keys(routes).forEach(route => {
    if (route.indexOf('/') !== 0) {
      throw new Error('Route must start with /')
    }
    if (route.indexOf('/', 1) > 1) {
      throw new Error('Route can only have one /')
    }
    if (typeof routes[route] !== 'function') {
      throw new Error('Route handler must be a function')
    }
  })
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
  // Get first url part (/first/second...).
  const nextPartIndex = request.url.indexOf('/', 1)
  const currentPart = request.url.substring(0, (nextPartIndex > 1 ? nextPartIndex : request.url.length))
  const nextUrl = request.url.substring(currentPart.length)
  const nextRequest = Object.assign({}, request, {url: nextUrl})

  if (routes.hasOwnProperty(currentPart)) {
    return routes[currentPart](nextRequest)
  }
  else {
    throw new NoHandlerError('No handler found for route ' + currentPart)
  }
}

// A router is a handler that sends requests to handlers based on url.
export default function createRouter(routes) {
  validateRoutes(routes)
  return handle.bind(null, routes)
}
