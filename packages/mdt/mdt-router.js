// A router is a handler itself.
Router = function Router(routes) {
  _.each(routes, (handler, route) => {
    this.registerHandler(route, handler)
  })
}

Router.prototype.registerHandler = function(route, handler) {
  if (route.indexOf('/') !== 0) {
    throw new Error('Route must start with /')
  }
  if (route.indexOf('/', 1) > 1) {
    throw new Error('Route can only have one /')
  }
  if (this.hasOwnProperty(route)) {
    throw new Error('Handler already exists for route ' + route)
  }
  // Should handlers be public?
  this[route] = handler
}

Router.prototype.handle = function(url, data) {
  // Get first route
  var nextIndex = url.indexOf('/', 1)
  var currentRoute = url.substring(0, (nextIndex > 1 ? nextIndex : url.length))
  var nextRoute = url.substring(currentRoute.length)
  if (this.hasOwnProperty(currentRoute)) {
    return this[currentRoute].handle(nextRoute, data)
  }
  else {
    throw new NoHandlerError('No handler found for route ' + currentRoute)
  }
}
