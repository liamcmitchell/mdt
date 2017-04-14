import isObservable from './isObservable'
import {of} from 'rxjs/observable/of'

export default function ensureObservable(o) {
  return isObservable(o) ? o : of(o)
}
