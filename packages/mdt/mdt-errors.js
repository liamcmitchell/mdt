//
// Error types.
//

// Thrown when handler is unable to return data yet.
NoDataError = function NoDataError(message) {
  this.name = 'NoDataError'
  this.message = message || 'Data is not available yet.'
  this.stack = (new Error()).stack
}
NoDataError.prototype = Object.create(Error.prototype)
NoDataError.prototype.constructor = NoDataError

// Thrown when handler is not found.
NoHandlerError = function NoHandlerError(message) {
  this.name = 'NoHandlerError'
  this.message = message || 'No handler found for route.'
  this.stack = (new Error()).stack
}
NoHandlerError.prototype = Object.create(Error.prototype)
NoHandlerError.prototype.constructor = NoHandlerError
