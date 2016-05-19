import nodesFromValue from './node-from-value'

const sourceUrl = ['file', 'test', 'mdt.json']

export default {
  key: 'json',
  item: 'json',
  nodes: ({source}) =>
    source({
      method: 'OBSERVE',
      url: sourceUrl
    })
    .map(contents => {
      return nodesFromValue({
        value: JSON.parse(contents),
        path: ['json'],
        onChange: (newValue) => {
          return source({
            method: 'SET',
            url: sourceUrl,
            value: JSON.stringify(newValue, null, 2)
          })
        }
      })
    })
}
