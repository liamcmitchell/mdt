import nodesFromValue from './node-from-value'

const url = ['json', 'file', 'test', 'domains.json']
const schema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: {type: 'string'},
      text: {type: 'string'}
    },
    required: ['name', 'text']
  }
}

export default {
  key: 'domains',
  item: 'domains',
  nodes: ({source, path}) =>
    source({
      method: 'OBSERVE',
      url: url
    })
    .map(value => {
      return nodesFromValue({
        value: value,
        path: path,
        schema: schema,
        onChange: (newValue) => {
          return source({
            method: 'SET',
            url: url,
            value: newValue
          })
        }
      })
    })
}
