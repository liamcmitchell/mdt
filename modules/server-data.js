import sourceInterface from 'source'
import sourceRoutes from 'source/routes'
import fileSource from 'sources/file'
import dirSource from 'sources/dir'

const data = sourceInterface(sourceRoutes({
  file: fileSource,
  dir: dirSource
}))

export default data
