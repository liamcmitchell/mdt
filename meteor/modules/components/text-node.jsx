import { Component, PropTypes } from "react"
import Node from "components/node"
import NodeItem from "components/node-item"
import NodeContent from "components/node-content"

class TextNode extends Component {
  static isNode = true

  static propTypes = {
    text: PropTypes.string.isRequired
  }

  render() {
    return <Node {...this.props}>
      <NodeItem>
        {this.props.text}
      </NodeItem>
      <NodeContent>
        {this.props.children}
      </NodeContent>
    </Node>
  }
}

export default TextNode
