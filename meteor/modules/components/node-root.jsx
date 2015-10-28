/* global mdt */
import { Component } from "react"
import Node from "components/node"
import NodeContent from "components/node-content"
import Cursor from "lib/cursor"
import childrenToArray from "lib/childrenToArray"

// Helper to make starting the node chain easier.
class NodeRoot extends Component {
  constructor(props, context) {
    super(props, context)

    const children = childrenToArray(props.children)

    this.state = {
      path: this.props.defaultPath ||
        children.length && children[0].key ?
          [children[0].key] :
          []
    }
  }

  render() {
    return <Node
      root
      render="content"
      cursor={new Cursor(this.state.path, path =>
        this.setState({path})
      )}
      {...this.props}
    >
      <NodeContent>
        {this.props.children}
      </NodeContent>
    </Node>
  }
}

export default NodeRoot
