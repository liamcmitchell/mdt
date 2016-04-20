export function isNode(node) {
  return node && node.hasOwnProperty('key') && node.hasOwnProperty('item')
}

export function isFocusable(node) {
  return node && node.focusable !== false
}

export function nodeWithKey(key) {
  return function(node) {
    return isNode(node) && node.key === key
  }
}
