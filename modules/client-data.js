import Data from 'data'
import serverSource from 'sources/server'
import pathSource from 'sources/path'

function alias(route, source) {
  return {
    handle: function(request) {
      return source.handle(Object.assign({}, request, {url: route + request.url}))
    }
  }
}

const data = new Data({
  '/server': serverSource,
  // Alias to server
  '/file': alias('/file', serverSource),
  '/dir': alias('/dir', serverSource),
  '/path': pathSource
})

export default data
