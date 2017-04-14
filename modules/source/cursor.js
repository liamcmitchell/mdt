import {methods} from 'url-io'
import {BehaviorSubject} from 'rxjs/BehaviorSubject'
import {map} from 'rxjs/operator/map'
import {distinctUntilChanged} from 'rxjs/operator/distinctUntilChanged'

// Messy because we are syncing with history API and reseting editing on
// path change.
export default function createCursorSource(history) {
  const cursor = new BehaviorSubject({
    path: '',
    editing: false
  })

  if (history) {
    // Listen for changes.
    history.listen(({ pathname }) => {
      if (pathname !== cursor.getValue().path) {
        // This path change is coming from user navigation.
        cursor.next({
          path: pathname,
          editing: false
        })
      }
    })
    // Update history on change.
    cursor
      ::distinctUntilChanged(c => c.path)
      .subscribe(c => {
        history.replaceState(null, c.path)
      })
  }

  return methods({
    OBSERVE: function({path}) {
      if (path === '') {
        return cursor
      }
      else if (path === '/path') {
        return cursor::map(c => c.path)
      }
      else if (path === '/editing') {
        return cursor::map(c => c.editing)
      }
      else {
        throw new Error('Url not supported')
      }
    },
    SET: function({path, params: {value}}) {
      if (path === '') {
        cursor.next(value)
      }
      else if (path === '/path') {
        cursor.next({
          path: value,
          editing: false
        })
      }
      else if (path === '/editing') {
        cursor.next({
          path: cursor.getValue().path,
          editing: value
        })
      }
      else {
        throw new Error('Path not supported')
      }
      return Promise.resolve()
    } 
  })
}
