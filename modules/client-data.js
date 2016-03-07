import createDataSource from 'data'
import alias from 'data/alias'
import createSource from 'data/createSource'
import createMemorySource from 'data/createMemorySource'
import createRouter from 'data/createRouter'
import remoteSource from 'sources/remote'
import pathSource from 'sources/path'
import Rx from 'rx'

const serverSource = remoteSource(document.location.origin)

const data = createDataSource({
  server: serverSource,
  // Alias to server
  file: alias('/file', serverSource),
  dir: alias('/dir', serverSource),
  path: pathSource,
  editing: createMemorySource(false),
  cursor: createRouter({
    path: createMemorySource([]),
    editing: createMemorySource(false)
  })
})

export default data
