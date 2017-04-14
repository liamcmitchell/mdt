import {paths, alias, json, location} from 'url-io'
import createHistory from 'history/lib/createBrowserHistory'
import remote from './remote'
import node from './node'
import nodes from './nodes'
import {interval} from 'rxjs/observable/interval'

export default paths({
  '/server': remote(document.location.origin),
  '/file': alias('/server/file'),
  '/dir': alias('/server/dir'),
  '/json': json,
  '/location': location(createHistory()),
  '/node': node(nodes),
  '/test': () => interval(1000)
})
