import {routes} from 'react-io'
import alias from 'react-io/lib/source/alias'
import sourceJSON from 'react-io/lib/source/json'

import remote from 'source/remote'
import cursor from 'source/cursor'

import createHistory from 'history/lib/createBrowserHistory'
import nodeSource from './nodes'

const source = routes({
  '/server': remote(document.location.origin),
  '/file': alias('/server/file'),
  '/dir': alias('/server/dir'),
  '/json': sourceJSON,
  '/cursor': cursor(createHistory()),
  '/node': nodeSource
})

export default source
