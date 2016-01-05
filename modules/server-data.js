import Data from 'data'
import fileSource from 'sources/file'

const data = new Data({
  '/local': fileSource
})

export default data
