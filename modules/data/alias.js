import urlToArray from './url-to-array'

export default function alias(base, source) {
  return function(request) {
    return source(Object.assign({}, request, {url: urlToArray(base).concat(request.url)}))
  }
}
