import {map} from 'rxjs/operators/map'
import qs from 'qs'

// Parse/stringify query string.
const fromStandardLocation = (location) => ({
  ...location,
  search: qs.parse(location.search.slice(1)),
})
const toStandardLocation = (location) =>
  !location.search
    ? location
    : {
        ...location,
        search: '?' + qs.stringify(location.search),
      }

export default function parseLocation() {
  return (source) => (request) => {
    const {method, params} = request

    if (method === 'OBSERVE') {
      return source(request).pipe(map(fromStandardLocation))
    } else {
      return source({
        ...request,
        params: toStandardLocation(params),
      })
    }
  }
}
