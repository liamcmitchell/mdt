import Rx from 'rx'
import _ from 'underscore'

// Turn object into observable if it isn't already.
export default function $(v) {
  return Rx.Observable.isObservable(v) ? v : Rx.Observable.just(v)
}

$.isObservable = Rx.Observable.isObservable
$.throw = Rx.Observable.throw

$.combineLatest = function combineLatest(observables, fn) {
  if (Rx.Observable.isObservable(observables)) {
    return observables.map(fn)
  }
  else if (_.isArray(observables)) {
    return Rx.Observable.combineLatest(observables, fn)
  }
  else if (_.isObject(observables)) {
    const keys = _.keys(observables)
    return Rx.Observable.combineLatest(_.values(observables))
      .map(values => fn(_.object(keys, values)))
  }
  else {
    throw new Error('Require observable, array or object of observables')
  }
}
