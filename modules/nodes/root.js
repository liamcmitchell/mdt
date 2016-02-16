import localNode from './local'
import dummyNode from './dummy'
import jsonNode from './json'
import fsJsonNode from './fs-json'

export default {
  nodes: [
    dummyNode,
    localNode,
    jsonNode,
    fsJsonNode
  ]
}