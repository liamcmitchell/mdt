import fs from 'fs'
import {basename} from 'path'
import async from 'async'
import chokidar from 'chokidar'
import {methods} from 'url-io'
import sortBy from 'lodash/sortBy'
import {Observable} from 'rxjs/Observable'

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

export default methods({
  OBSERVE: function({path}) {
    return Observable.create(observer => {
      // Url is relative to project root.
      const localPath = '.' + path
      // TODO: Read could be shared with connected observable.
      const read = () => {
        ls(localPath, (err, items) => {
          if (err)
            observer.error(err)
          else
            observer.next(sortBy(items, ['name', 'isFile']))
        })
      }
      const watcher = chokidar.watch(localPath, {ignoreInitial: true})
      watcher.on('add', read)
      watcher.on('unlink', read)
      watcher.on('addDir', read)
      watcher.on('unlinkDir', read)
      watcher.on('error', observer.error.bind(observer))
      read()
      // Return dispose function.
      return watcher.close.bind(watcher)
    })
  }
})
