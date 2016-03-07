import data from 'client-data'

export default function fsNodes(path) {
  return data('/dir' + path).map(items =>
    items.map(item => ({
      key: item.name,
      item: item.name + (item.isDirectory ? '/' : ''),
      nodes: item.isFile ?
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
