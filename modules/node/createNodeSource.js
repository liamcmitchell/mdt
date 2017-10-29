import {paths, methods} from 'url-io'
import ensureObservable from 'lib/ensureObservable'
import {of} from 'rxjs/observable/of'
import {map} from 'rxjs/operator/map'
import {switchMap} from 'rxjs/operator/switchMap'
import {pathToArray} from 'url-io'

const hasKey = key => node => node && node.key === key

const NODE_DEFAULTS = {
  children: [],
  handlers: []
}

/*
Resolve items from recursive tree.
Node has following structure:
{
  key: 'a', // Required. Must be plain string.
  item: 'A', // Required. React node to render.
  children: [], // Array of children nodes.
  handlers: [], // Array of key handlers: {key, label, fn}
}
All properties except for key can be defined as a funtion which takes a request object.
All properties except for key can return an observable (non-observables are converted).
*/
export default function createNodeSource(root) {
  return paths({
    '/meta': methods({
      OBSERVE: ({path, io, originalPath}) => {
        const pathArray = pathToArray(path)

        // Return root node.
        if (pathArray.length === 0) {
          return of(root)
        }

        // Find leaf in parent.
        const rootPath = originalPath.replace(`/meta/${path}`, '')
        const key = pathArray[pathArray.length - 1]
        const parentNodesPath = `${rootPath}/children/${pathArray.slice(0, pathArray.length - 1).join('/')}`
        return io(parentNodesPath)
          // If the node isn't there, return a dummy containing an error message.
          ::map(children => children.find(hasKey(key)) || {
            key: key,
            item: new Error(`${key} not found in ${parentNodesPath}`)
          })
      }
    }),
    '/:property': methods({
      OBSERVE: (request) => {
        const {path, io, property, originalPath} = request

        if (!property) {
          throw new Error('Node requires property e.g. meta or item')
        }

        const rootPath = originalPath.replace(`/${property}/${path}`, '')

        return io(`${rootPath}/meta/${path}`)
          // Property may resolve to be an observable so we need flatmap.
          ::switchMap(node => ensureObservable(
            // Use default if node doesn't have property.
            !node.hasOwnProperty(property) ?
              NODE_DEFAULTS[property] :
              // Resolve fn if needed. Pass entire request.
              typeof node[property] === 'function' ?
                node[property](request) :
                node[property]
          ))
      }
    })
  })
}
