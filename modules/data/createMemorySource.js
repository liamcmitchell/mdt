import createSource from 'data/createSource'
import Rx from 'rx'

export default function createMemorySource(initialValue) {
  const subject = new Rx.BehaviorSubject(initialValue)
  return createSource({
    OBSERVE: function(request, observer) {
      return subject.subscribe(observer)
    },
    SET: function(request, promise) {
      subject.onNext(request.data)
      promise.resolve()
    }
  })
}
