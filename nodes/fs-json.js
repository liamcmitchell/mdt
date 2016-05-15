import nodeFromValue from './node-from-value'

export default function nodes({fsPath, nodePath}, {source, path}) {
  // To get the path we care about, we replace the base node path with fs path.
  path = fsPath.concat(path.slice(nodePath.length))
  return source({
    method: 'OBSERVE',
    url: ['dir'].concat(path)
  }).map(items =>
    items.map(item => ({
      key: item.name,
      item: item.name + (item.isDirectory ? '/' : ''),
      nodes: item.isFile ?
        item.name.match(/\.json$/) ?
          source({
            method: 'OBSERVE',
            url: ['file'].concat(path, item.name)
          }).map(value =>
            nodeFromValue({
              value: JSON.parse(value),
              path: ['TODO']
            }).nodes
          ) :
          [{
            key: 'content',
            item: source({
              method: 'OBSERVE',
              url: ['file'].concat(path, item.name)
            }),
            focusable: false
          }] :
        fsNodesJson.bind(null, {fsPath, nodePath}),
      handlers: item.isFile ? [{
        key: 'enter',
        fn: function() {
          return source({
            method: 'OPEN',
            url: ['file'].concat(path, item.name)
          })
        }
      }] :
      []
    }))
  )
}

// Take fs path on config.
export default function fsNodesJson(fsPath) {
  // Then get node path from first call.
  return ({source, path}) =>
    nodes({fsPath, nodePath: path}, {source, path})
}
