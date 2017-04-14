import fs from 'fs'
import chokidar from 'chokidar'
import open from 'open'
import {methods} from 'url-io'
import {Observable} from 'rxjs/Observable'

export default methods({
  OBSERVE: function({path}) {
    return Observable.create(observer => {
      // Url is relative to project root.
      const localPath = '.' + path

      // TODO: Read could be shared with connected observable.
      const read = () => {
        fs.readFile(localPath, 'utf-8', (error, data) => {
          if (error) {
            observer.error(error)
          }
          else {
            observer.next(data)
          }
        })
      }
      const watcher = chokidar.watch(localPath, {ignoreInitial: true})
      watcher.on('change', read)
      watcher.on('unlink', read)
      watcher.on('error', observer.error.bind(observer))
      read()
      // Return dispose function.
      return watcher.close.bind(watcher)
    })
  },
  OPEN: function({path}) {
    // Url is relative to project root.
    const localPath = '.' + path
    open(localPath)
    return Promise.resolve()
  },
  SET: function({path, params: {value}}) {
    // Url is relative to project root.
    const localPath = '.' + path
    return new Promise((resolve, reject) => {
      fs.writeFile(localPath, value, err => {
        if (err)
          reject(err)
        else
          resolve()
      })
    })
  }
})
