import data from 'client-data'

export default function fsNodes(path) {
  return data.observable('/dir' + path).map(items =>
    items.map(item => ({
      key: item.name,
      item: item.name + (item.isDirectory ? '/' : ''),
      nodes: item.isFile ?
        [{
          key: 'content',
          item: data.observable('/file' + path + '/' + item.name),
          focusable: false
        }] :
        fsNodes(path + '/' + item.name),
      handlers: item.isFile ? {
        enter: function() {
          data.call({
            url: '/file' + path + '/' + item.name,
            method: 'OPEN'
          })
        }
      } :
      null
    }))
  )
}
