import isObservable from './isObservable'
import {of} from 'rxjs/observable/of'

export default (o) => (isObservable(o) ? o : of(o))
