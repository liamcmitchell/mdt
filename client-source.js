import sourceInterface from 'source/interface'
import sourceRoutes from 'source/routes'
import sourceAlias from 'source/alias'
import sourceCache from 'source/cache'
import sourceRemote from 'source/remote'
import cursorSource from 'source/cursor'
import sourceJSON from 'source/json'
import createHistory from 'history/lib/createBrowserHistory'
import nodeSource from './nodes'

const source = sourceInterface(sourceCache(sourceRoutes({
  server: sourceRemote(document.location.origin),
  file: sourceAlias('/server/file'),
  dir: sourceAlias('/server/dir'),
  json: sourceJSON,
  cursor: cursorSource(createHistory()),
  node: nodeSource
})))

export default source
