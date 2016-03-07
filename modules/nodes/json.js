import data from 'client-data'
import nodeFromValue from './node-from-value'

export default {
  key: 'json',
  item: 'mdt.json',
  nodes: data('/file/mdt.json').map(contents => {
    return nodeFromValue(JSON.parse(contents), ['json'], (newValue) => {
      return data('/file/mdt.json').set(JSON.stringify(newValue, null, 2))
    }).nodes
  })
}
