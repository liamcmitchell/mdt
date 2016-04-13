import sourceInterface from 'source'
import sourceRoutes from 'source/routes'
import sourceAlias from 'source/alias'
import remoteSource from 'sources/remote'
import cursorSource from 'sources/cursor'
import createHistory from 'history/lib/createBrowserHistory'

const data = sourceInterface(sourceRoutes({
  server: remoteSource(document.location.origin),
  file: sourceAlias('/server/file'),
  dir: sourceAlias('/server/dir'),
  cursor: cursorSource(createHistory())
}))

export default data
