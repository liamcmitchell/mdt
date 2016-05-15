import nodeSource from 'source/node'

import domainsNode from './nodes/domains'
import jsonNode from './nodes/json'
import dummyNode from './nodes/dummy'

import fsNodes from './nodes/fs'
import fsNodesJson from './nodes/fs-json'

export default nodeSource({
  nodes: [
    domainsNode,
    jsonNode,
    dummyNode,
    {
      key: 'local',
      item: 'local',
      nodes: fsNodes([])
    },
    {
      key: 'local-json',
      item: 'local with json',
      nodes: fsNodesJson([])
    }
  ]
})
