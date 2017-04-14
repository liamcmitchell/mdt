import {paths} from 'url-io'
import file from './file'
import dir from './dir'

export default paths({
  '/file': file,
  '/dir': dir
})
