import Data from 'data'
import fileSource from 'sources/file'
import dirSource from 'sources/dir'

const data = new Data({
  file: fileSource,
  dir: dirSource
})

export default data
