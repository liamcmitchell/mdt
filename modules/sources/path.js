import createHistory from 'history/lib/createBrowserHistory'
import Rx from 'rx'

const history = createHistory()

// Returns observable of path.
function observable() { 
  return Rx.Observable.create(observer => {
    const dispose = history.listen(({ pathname }) => {
      observer.onNext(pathname)
    })
    // Return dispose function.
    return dispose
  })
}

export default {
  handle: function(request) {
    if (request.method === 'OBSERVABLE') {
      return observable()
    }
    else if (request.method === 'SET') {
      return history.replaceState(null, request.data)
    }
    else {
      throw new Error('Method not supported.', request)
    }
  }
}
