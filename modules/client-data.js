import sourceInterface from 'source/interface'
import sourceRoutes from 'source/routes'
import sourceAlias from 'source/alias'
import sourceCache from 'source/cache'
import remoteSource from 'sources/remote'
import cursorSource from 'sources/cursor'
import createHistory from 'history/lib/createBrowserHistory'

const data = sourceInterface(sourceCache(sourceRoutes({
  server: remoteSource(document.location.origin),
  file: sourceAlias('/server/file'),
  dir: sourceAlias('/server/dir'),
  cursor: cursorSource(createHistory())
})))

export default data
