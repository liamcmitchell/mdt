import {map} from 'rxjs/operator/map'

// fs and node path are passed down so relative urls can be used.
function nodes({io, path}) {
  return io(`/dir${path}`)::map(items =>
    items.map(item => ({
      key: item.name,
      item: item.name + (item.isDirectory ? '/' : ''),
      nodes: item.isFile ?
        [{
          key: 'content',
          item: io(`/file${path}/${item.name}`),
          focusable: false
        }] :
        nodes.bind(null, {io, path: `${path}/${item.name}`}),
      handlers: item.isFile ? [{
        key: 'enter',
        fn: () => io(`/file${path}/${item.name}`, 'OPEN')
      }] :
      []
    }))
  )
}

// Take fs path from config.
export default function fsNodes(fsPath) {
  return ({io}) => nodes({io, path: fsPath})
}
