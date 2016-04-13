import createHistory from 'history/lib/createBrowserHistory'
import sourceMethods from 'source/methods'
import _ from 'underscore'

const history = createHistory()

export default sourceMethods({
  OBSERVE: function(request, observer) {
    return history.listen(({ pathname }) => {
      observer.onNext(_.filter(pathname.split('/')))
    })
  },
  SET: function(request, promise) {
    history.replaceState(null, '/' + request.value.join('/'))
    promise.resolve()
  } 
})
