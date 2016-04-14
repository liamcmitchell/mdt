import data from 'client-data'
import nodeFromValue from './node-from-value'

function fsNodes(path) {
  return data('/dir' + path).map(items =>
    items.map(item => ({
      key: item.name,
      item: item.name + (item.isDirectory ? '/' : ''),
      nodes: () => item.isFile ?
        item.name.match(/\.json$/) ?
          data('/file' + path + '/' + item.name).map(value =>
            nodeFromValue(JSON.parse(value), ['TODO']).nodes
          ) :
          [{
            key: 'content',
            item: data('/file' + path + '/' + item.name),
            focusable: false
          }] :
        fsNodes(path + '/' + item.name),
      handlers: item.isFile ? [{
        key: 'enter',
        fn: function() {
          data('/file' + path + '/' + item.name).call({
            method: 'OPEN'
          })
        }
      }] :
      []
    }))
  )
}

export default {
  key: 'local-json',
  item: 'local with json',
  nodes: fsNodes('')
}