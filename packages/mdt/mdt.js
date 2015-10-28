// Public interface.
MDT = function MDT(config) {
  this.router = new Router({
    // The source of all of our power.
    // Should config be public?
    // Don't worry for now, abuse at your own risk.
    "/config": {
      handle: function() { return config }
    }
  })
}

// Get data from MDT sources, caller must have it now.
// Will throw an error if the resource is not ready.
MDT.prototype.require = function(url, data) {
  return this.router.handle(url, data)
}

// Get data from MDT sources, caller can handle null if we don't have it yet.
MDT.prototype.request = function(url, data) {
  try {
    return this.require(url, data)
  }
  catch (error) {
    if (error instanceof NoDataError) {
      return null
    }
    else {
      throw error
    }
  }
}

MDT.prototype.Router = Router
MDT.prototype.NoDataError = NoDataError
MDT.prototype.NoHandlerError = NoHandlerError
