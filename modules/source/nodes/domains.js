import nodesFromValue from './node-from-value'
import {map} from 'rxjs/operator/map'

const url = '/json/file/test/domains.json'
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
  nodes: ({io, path}) =>
    io(url)::map(value =>
      nodesFromValue({
        value: value,
        path: path,
        schema: schema,
        onChange: (newValue) => {
          return io(url, 'SET', {
            value: newValue
          })
        }
      })
    )
}
