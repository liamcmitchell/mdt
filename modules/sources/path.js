import createHistory from 'history/lib/createBrowserHistory'
import Rx from 'rx'
import createSource from 'data/createSource'

const history = createHistory()

export default createSource({
  OBSERVE: function(request, observer) {
    return history.listen(({ pathname }) => {
      observer.onNext(pathname)
    })
  },
  SET: function(request, promise) {
    history.replaceState(null, request.data)
    promise.resolve()
  } 
})
