import React, { Component, PropTypes } from "react"
import Node from "components/node"
import NodeItem from "components/node-item"
import NodeContent from "components/node-content"
import InputNode from "components/input-node"

class ObjectInputNode extends Component {
  static isNode = true

  static propTypes = {
    value: PropTypes.object.isRequired,
    onValueChange: PropTypes.func.isRequired,
    schema: PropTypes.object
  }

  static defaultProps = {
    value: {},
    schema: {}
  }

  render() {
    const object = this.props.value
    const properties = Object.keys(object).map(name =>
      <Node
        key={name}
      >
        <NodeItem>
          {name}
        </NodeItem>
        <NodeContent>
          <InputNode
            key="input"
            value={object[name]}
            onValueChange={this._handleValueChange.bind(this, name)}
          />
        </NodeContent>
      </Node>
    )

    return <Node
      {...this.props}
    >
      <NodeItem>
        {this.props.text || "object"}
      </NodeItem>
      <NodeContent>
        {properties}
      </NodeContent>
    </Node>
  }

  _handleNameChange(currentName, newName) {

  }

  _handleValueChange(name, value) {

  }

  _handleDelete(name) {

  }
}

export default ObjectInputNode
