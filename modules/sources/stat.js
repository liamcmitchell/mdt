import fs from 'fs'
import chokidar from 'chokidar'
import createSource from 'data/createSource'
import urlToString from 'data/url-to-string'

export default createSource({
  OBSERVE: function(request, observer) {
    // Url is relative to project root.
    const url = '.' + urlToString(request.url)
    // TODO: Read could be shared with connected observable.
    const read = () => {
      fs.readdir(url, (error, data) => {
        if (error) {
          observer.onError(error)
        }
        else {
          observer.onNext(data)
        }
      })
    }
    const watcher = chokidar.watch(url, {ignoreInitial: true})
    watcher.on('add', read)
    watcher.on('unlink', read)
    watcher.on('addDir', read)
    watcher.on('unlinkDir', read)
    watcher.on('error', observer.onError.bind(observer))
    read()
    // Return dispose function.
    return watcher.close.bind(watcher)
  }
})
