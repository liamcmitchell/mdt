/* global mdt */
import { Component } from "react"
import NodeRoot from "components/node-root"
import TextNode from "components/text-node"
import InputNode from "components/input-node"
import colors from "lib/colors"

const testVal = {
  "null": null,
  "boolean": true,
  "number": 123,
  "string": "yo",
  "array": [1, 2],
  "object": {
    key: "value"
  }
}

class App extends Component {
  constructor(props, context) {
    super(props, context)

    this.state = {
      value: testVal
    }
  }

  render() {
    return <NodeRoot
      styles={Object.assign({
        padding: "10px 20px"
      }, colors.solarizedDark)}
    >
      <InputNode
        key="input"
        value={this.state.value}
        onValueChange={this._handleValueChange.bind(this)}
      />
      <TextNode
        key="mdt"
        text="mdt"
      >
        {mdt.require("/config").mdtVersion}
      </TextNode>
    </NodeRoot>
  }

  _handleValueChange(value) {
    console.log("value", value)
    this.setState({value: value})
  }
}

export default App
