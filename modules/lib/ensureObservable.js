import isObservable from './isObservable'
import {of} from 'rxjs'

export default (o) => (isObservable(o) ? o : of(o))
