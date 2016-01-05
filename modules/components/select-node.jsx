import React, { Component, PropTypes } from "react"
import Node from "components/node"
import NodeItem from "components/node-item"
import NodeContent from "components/node-content"

class SelectNode extends Component {
  static isNode = true

  static propTypes = {
    value: PropTypes.string.isRequired,
    onValueChange: PropTypes.func.isRequired,
    options: PropTypes.array.isRequired
  }

  render() {
    const options = this.props.options.map(opt =>
      <Node
        key={opt}
      >
        <NodeItem
          handlers={{
            enter: () => this.props.onValueChange(opt)
          }}
        >
          {opt + (this.props.value === opt ? " *" : "")}
        </NodeItem>
      </Node>
    )

    return <Node
      {...this.props}
    >
      <NodeItem>
        {this.props.text || this.props.value}
      </NodeItem>
      <NodeContent>
        {options}
      </NodeContent>
    </Node>
  }
}

export default SelectNode
