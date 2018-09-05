import {createIO, routes, storage, location} from 'url-io'
import createHistory from 'history/createBrowserHistory'
import parseLocation from 'io/parseLocation'
import createNodeSource from 'node/createNodeSource'
import rootNode from 'io/rootNode'
import styles from 'io/styles'

export default createIO(
  routes({
    '/location': parseLocation()(location(createHistory())),
    '/node': createNodeSource(rootNode),
    '/localStorage': storage(window.localStorage),
    '/styles': styles,
  })
)
