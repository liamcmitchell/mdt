import flowRight from 'lodash/flowRight'
import {routes} from 'react-io'
import urlFirstApi from 'react-io/lib/urlFirstApi'
import allowRecursion from 'react-io/lib/source/allowRecursion'
import ensureStandardRequest from 'react-io/lib/source/ensureStandardRequest'
import allowNesting from 'react-io/lib/source/allowNesting'
import handleMultipleUrls from 'react-io/lib/source/handleMultipleUrls'
import cache from 'react-io/lib/source/cache'

import fileSource from 'source/file'
import dirSource from 'source/dir'

// Can't use createIO because it uses react.
// TODO: Split out into url-io.
const source = flowRight([
  handleMultipleUrls,
  allowNesting,
  cache,
  allowRecursion,
  ensureStandardRequest
])(routes({
  '/file': fileSource,
  '/dir': dirSource
}))


export default urlFirstApi(source, {
  getObservable: function() {
    return this.call({method: 'OBSERVE'})
  },

  // Allows use as observable.
  subscribe: function() {
    const o = this.getObservable()
    return o.subscribe.apply(o, arguments)
  },

  getPromise: function() {
    return this.call({method: 'GET'})
  },

  // Allows use as promise.
  next: function() {
    const p = this.getPromise()
    return p.next.apply(p, arguments)
  },

  set: function(value) {
    return this.call({
      method: 'SET',
      value: value
    })
  }
  }
)
