import nodesFromValue from './node-from-value'
import {map} from 'rxjs/operator/map'

export default function nodes({io, path}) {
  return io(`/dir${path}`)::map(items =>
    items.map(item => ({
      key: item.name,
      item: item.name + (item.isDirectory ? '/' : ''),
      nodes: item.isFile ?
        item.name.match(/\.json$/) ?
          io(`/file${path}/${item.name}`)::map(value =>
            nodesFromValue({
              value: JSON.parse(value),
              path: ['TODO']
            })
          ) :
          [{
            key: 'content',
            item: io(`/file${path}/${item.name}`),
            focusable: false
          }] :
        nodes.bind(null, {io, path: `${path}/${item.name}`}),
      handlers: item.isFile ? [{
        key: 'enter',
        fn: function() {
          return io(`/file${path}/${item.name}`, 'OPEN')
        }
      }] :
      []
    }))
  )
}

// Take fsPath from config.
export default function fsNodesJson(fsPath) {
  return ({io}) => nodes({io, path: fsPath})
}
