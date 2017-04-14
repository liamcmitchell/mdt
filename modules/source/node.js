import {paths, methods} from 'url-io'
import ensureObservable from 'lib/ensureObservable'
import {of} from 'rxjs/observable/of'
import {map} from 'rxjs/operator/map'
import {switchMap} from 'rxjs/operator/switchMap'

function hasKey(key) {
  return function(node) {
    return node && node.key === key
  }
}

const NODE_DEFAULTS = {
  nodes: [],
  handlers: []
}

export default function nodeSource(root) {
  return paths({
    '/node': methods({
      OBSERVE: ({path, io}) => {
        const pathPieces = path.split('/').filter(v => !!v)

        // Return root node.
        if (pathPieces.length === 0) {
          return of(root)
        }

        // Return node at path.
        const key = pathPieces[pathPieces.length - 1]
        const parentUrl = '/node/nodes/' + pathPieces.slice(0, pathPieces.length - 1).join('/')
        return io(parentUrl)
          // If the node isn't there, return a dummy containing an error message.
          ::map(nodes => nodes.find(hasKey(key)) || {
            key: key,
            item: new Error(key + '" not found')
          })
      }
    }),
    '/:property': methods({
      OBSERVE: ({path, io, property}) => {
        if (!property) {
          throw new Error('Node requires property e.g. node/node or node/item')
        }

        const nodeUrl = `/node/node${path}`

        return io(nodeUrl)
          // Property may resolve to be an observable so we need flatmap.
          ::switchMap(node => ensureObservable(
            // Use default if node doesn't have property.
            !node.hasOwnProperty(property) ?
              NODE_DEFAULTS[property] :
              // Resolve fn if needed. Pass source and path.
              typeof node[property] === 'function' ?
                // TODO: This isn't right!!!!!!!
                node[property]({io, path}) :
                node[property]
          ))
      }
    })
  })
}
