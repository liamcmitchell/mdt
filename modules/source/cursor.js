import Rx from 'rx'
import _ from 'underscore'
// Where you left off: react-io now uses strings...
import sourceMethods from 'source/methods'

// Messy because we are syncing with history API and reseting editing on
// path change.
export default function createCursorSource(history) {
  const cursor = new Rx.BehaviorSubject({
    path: [],
    editing: false
  })

  if (history) {
    // Listen for changes.
    history.listen(({ pathname }) => {
      const path = _.filter(pathname.split('/'))
      if (!_.isEqual(path, cursor.getValue().path)) {
        // This path change is coming from user navigation.
        cursor.onNext({
          path: path,
          editing: false
        })
      }
    })
    // Update history on change.
    cursor
      .distinctUntilChanged(c => c.path, _.isEqual)
      .subscribe(c => {
        history.replaceState(null, '/' + c.path.join('/'))
      })
  }

  return sourceMethods({
    OBSERVE: function(request, observer) {
      if (request.url[0] === undefined) {
        return cursor.subscribe(observer)
      }
      else if (request.url[0] === 'path') {
        return cursor.map(c => c.path).subscribe(observer)
      }
      else if (request.url[0] === 'editing') {
        return cursor.map(c => c.editing).subscribe(observer)
      }
      else {
        throw new Error('Url not supported')
      }
    },
    SET: function(request, promise) {
      if (request.url[0] === undefined) {
        cursor.onNext(request.value)
      }
      else if (request.url[0] === 'path') {
        cursor.onNext({
          path: request.value,
          editing: false
        })
      }
      else if (request.url[0] === 'editing') {
        cursor.onNext({
          path: cursor.getValue().path,
          editing: request.value
        })
      }
      else {
        throw new Error('Url not supported')
      }
      promise.resolve()
    } 
  })
}