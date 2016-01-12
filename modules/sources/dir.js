const fs = require('fs')
const Rx = require('rx')
const chokidar = require('chokidar')

// Returns observable for file contents.
// Errors if file doesn't exist or is deleted.
function observable(url) {
  // Url is relative to project root.
  url = '.' + url
  return Rx.Observable.create(observer => {
    // TODO: Read could be shared with connected observable.
    var read = () => {
      fs.readdir(url, (error, data) => {
        if (error) {
          observer.onError(error)
        }
        else {
          observer.onNext(data)
        }
      })
    }
    var watcher = chokidar.watch(url, {ignoreInitial: true})
    watcher.on('add', read)
    watcher.on('unlink', read)
    watcher.on('addDir', read)
    watcher.on('unlinkDir', read)
    watcher.on('error', observer.onError.bind(observer))
    read()
    // Return dispose function.
    return watcher.close.bind(watcher)
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
