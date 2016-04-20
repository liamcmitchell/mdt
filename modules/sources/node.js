import nodeSource from 'source/node'

import dummyNode from 'nodes/dummy'
import jsonNode from 'nodes/json'
import fsNodes from 'nodes/fs'
import fsNodesJson from 'nodes/fs-json'

export default nodeSource({
  nodes: [
    dummyNode,
    jsonNode,
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
