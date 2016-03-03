import $ from 'lib/rx'

export function isNode(node) {
  return node && node.hasOwnProperty('key') && node.hasOwnProperty('item')
}

export function isFocusable(node) {
  return node && node.focusable !== false
}

export function getProp(prop, fallback, object) {
  return object.hasOwnProperty(prop) ?
    typeof object[prop] === 'function' ?
      object[prop]() :
      object[prop] :
    fallback
}

export function getProp$(prop, fallback, object$) {
  return $.isObservable(object$) ?
    object$.flatMapLatest(object =>
      $(getProp(prop, fallback, object))
    ) :
    $(getProp(prop, fallback, object$))
}

export const nodeItem$ = getProp$.bind(null, 'item', null)
export const nodeChildren$ = getProp$.bind(null, 'nodes', [])
export const nodeHandlers$ = getProp$.bind(null, 'handlers', [])

// Helper for common find arg.
export function nodeWithKey(key) {
  return function(node) {
    return isNode(node) && node.key === key
  }
}

export function nodeAtPath$(node$, path) {
  return path.reduce(nodeChild$, node$)
}

export function nodeChild$(node$, key) {
  return node$
    .flatMapLatest(nodeChildren$)
    // If the node isn't there, return a dummy containing an error message.
    .map(children => children.find(nodeWithKey(key)) || {
      key: key,
      item: new Error(key + '" not found')
    })
}
