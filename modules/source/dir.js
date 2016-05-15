import fs from 'fs'
import { basename } from 'path'
import async from 'async'
import chokidar from 'chokidar'
import sourceMethods from 'source/methods'
import urlToString from 'source/url-to-string'
import { sortBy } from 'underscore'

function stat(path, cb) {
  fs.stat(path, (err, stats) => {
    if (err)
      cb(err)
    else
      cb(null, {
        name: basename(path),
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      })
  })
}

function ls(path, cb) {
  fs.readdir(path, (err, items) => {
    if (err)
      cb(err)
    else
      async.map(items.map(item => path + '/' + item), stat, cb)
  })
}

export default sourceMethods({
  OBSERVE: function(request, observer) {
    // Url is relative to project root.
    const url = '.' + urlToString(request.url)
    // TODO: Read could be shared with connected observable.
    const read = () => {
      ls(url, (err, items) => {
        if (err)
          observer.onError(err)
        else
          observer.onNext(sortBy(sortBy(items, 'name'), 'isFile'))
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
