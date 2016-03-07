import createHistory from 'history/lib/createBrowserHistory'
import createSource from 'data/createSource'

const history = createHistory()

export default createSource({
  OBSERVE: function(request, observer) {
    return history.listen(({ pathname }) => {
      observer.onNext(pathname)
    })
  },
  SET: function(request, promise) {
    history.replaceState(null, request.value)
    promise.resolve()
  } 
})
