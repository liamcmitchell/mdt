export default function alias(route, source) {
  return function(request) {
    return source(Object.assign({}, request, {url: route + request.url}))
  }
}
