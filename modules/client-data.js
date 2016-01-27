import Data from 'data'
import remoteSource from 'sources/remote'
import pathSource from 'sources/path'

function alias(route, source) {
  return function(request) {
    return source(Object.assign({}, request, {url: route + request.url}))
  }
}

const serverSource = remoteSource(document.location.origin)

const data = new Data({
  '/server': serverSource,
  // Alias to server
  '/file': alias('/file', serverSource),
  '/dir': alias('/dir', serverSource),
  '/path': pathSource
})

export default data
