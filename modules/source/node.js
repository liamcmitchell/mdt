import sourceMethods from 'source/methods'
import $ from 'lib/rx'

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
  return sourceMethods({
    OBSERVE: function(request, observer) {
      const { url, source } = request
      const property = url[0]
      const path = url.slice(1)

      if (property === undefined) {
        throw new Error('Node requires property e.g. node/node or node/item')
      }

      // Return root node.
      else if (property === 'node' && path.length === 0) {
        observer.onNext(root)
      }

      // Return node at path.
      else if (property === 'node') {
        const key = path[path.length - 1]
        return source({
          method: 'OBSERVE',
          url: ['node', 'nodes'].concat(path.slice(0, path.length - 1))
        })
          // If the node isn't there, return a dummy containing an error message.
          .map(nodes => nodes.find(hasKey(key)) || {
            key: key,
            item: new Error(key + '" not found')
          })
          .subscribe(observer)
      }

      // Return property from node at path.
      else {
        return source({
          method: 'OBSERVE',
          url: ['node', 'node'].concat(path)
        })
          // Property may resolve to be an observable so we need flatmap.
          .flatMapLatest(node => $(
            // Use default if node doesn't have property.
            !node.hasOwnProperty(property) ?
              NODE_DEFAULTS[property] :
              // Resolve fn if needed. Pass source and path.
              typeof node[property] === 'function' ?
                node[property]({source, path}) :
                node[property]
          ))
          .subscribe(observer)
      }
    }
  })
}
