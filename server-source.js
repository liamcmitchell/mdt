import sourceInterface from 'source/interface'
import sourceRoutes from 'source/routes'
import fileSource from 'source/file'
import dirSource from 'source/dir'

const data = sourceInterface(sourceRoutes({
  file: fileSource,
  dir: dirSource
}))

export default data
