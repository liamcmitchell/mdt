const fs = require('fs')
const Rx = require('rx')
const chokidar = require('chokidar')

// Returns observable for file contents.
// Errors if file doesn't exist or is deleted.
function fileSource(url) {
  // Url is relative to project root so strip first slash.
  url = url.slice(1)
  return Rx.Observable.create(observer => {
    // TODO: Read could be shared with connected observable.
    var read = () => {
      fs.readFile(url, 'utf-8', (error, data) => {
        if (error) {
          observer.onError(error)
        }
        else {
          observer.onNext(data)
        }
      })
    }
    var watcher = chokidar.watch(url, {ignoreInitial: true})
    watcher.on('change', read)
    watcher.on('unlink', read)
    watcher.on('error', observer.onError.bind(observer))
    read()
    // Return dispose function.
    return watcher.close.bind(watcher)
  })
}

export default {
  handle: function(url, data) {
    if (data.method === 'OBSERVABLE') {
      return fileSource(url)
    }
  }
}
