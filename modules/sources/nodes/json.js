import nodeFromValue from './node-from-value'

export default {
  key: 'json',
  item: 'mdt.json',
  nodes: ({source}) =>
    source({
      method: 'OBSERVE',
      url: ['file', 'mdt.json']
    })
    .map(contents => {
      return nodeFromValue({
        value: JSON.parse(contents),
        path: ['json'],
        onChange: (newValue) => {
          return source({
            method: 'SET',
            url: ['file', 'mdt.json'],
            value: JSON.stringify(newValue, null, 2)
          })
        }
      }).nodes
    })
}
