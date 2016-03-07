import fs from 'fs'
import chokidar from 'chokidar'
import open from 'open'
import createSource from 'data/createSource'
import urlToString from 'data/url-to-string'

export default createSource({
  OBSERVE: function(request, observer) {
    // Url is relative to project root.
    const url = '.' + urlToString(request.url)

    // TODO: Read could be shared with connected observable.
    const read = () => {
      fs.readFile(url, 'utf-8', (error, data) => {
        if (error) {
          observer.onError(error)
        }
        else {
          observer.onNext(data)
        }
      })
    }
    const watcher = chokidar.watch(url, {ignoreInitial: true})
    watcher.on('change', read)
    watcher.on('unlink', read)
    watcher.on('error', observer.onError.bind(observer))
    read()
    // Return dispose function.
    return watcher.close.bind(watcher)
  },
  OPEN: function(request, promise) {
    // Url is relative to project root.
    const url = '.' + urlToString(request.url)
    open(url)
    promise.resolve()
  },
  SET: function(request, promise) {
    // Url is relative to project root.
    const url = '.' + urlToString(request.url)
    fs.writeFile(url, request.value, err => {
      if (err)
        promise.reject(err)
      else
        promise.resolve()
    })
  }
})
