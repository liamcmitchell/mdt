import data from 'client-data'
import nodeFromValue from './node-from-value'

export default {
  key: 'json',
  item: 'mdt.json',
  nodes: data.observable('/file/mdt.json').map(contents => {
    return nodeFromValue(JSON.parse(contents), (newValue) => {
      data.set('/file/mdt.json', JSON.stringify(newValue, null, 2))
    }).nodes
  })
}
