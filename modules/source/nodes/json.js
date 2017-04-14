import nodesFromValue from './node-from-value'
import {map} from 'rxjs/operator/map'

const url = '/file/test/mdt.json'

export default {
  key: 'json',
  item: 'json',
  nodes: ({io}) =>
    io(url)::map(contents =>
      nodesFromValue({
        value: JSON.parse(contents),
        path: ['json'],
        onChange: (newValue) => {
          return io(url, 'SET', {
            value: JSON.stringify(newValue, null, 2)
          })
        }
      })
    )
}
