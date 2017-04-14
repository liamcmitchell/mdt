import domains from './domains'
import json from './json'
import dummy from './dummy'
import fs from './fs'
import fsJson from './fs-json'

export default {
  nodes: [
    domains,
    json,
    dummy,
    {
      key: 'local',
      item: 'local',
      nodes: fs('')
    },
    {
      key: 'local-json',
      item: 'local with json',
      nodes: fsJson('')
    }
  ]
}
