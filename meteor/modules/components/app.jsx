/* global mdt */
import { Component } from "react"
import NodeUI from "components/node-ui"
import colors from "lib/colors"
import mdtNode from "nodes/mdt"
import dummyNode from "nodes/dummy"

// const testVal = {
//   "null": null,
//   "boolean": true,
//   "number": 123,
//   "string": "yo",
//   "array": [1, 2],
//   "object": {
//     key: "value"
//   }
// }

// var Baobab = require('baobab')

// var tree = new Baobab({
//   path: [],
//   value: testVal,
//   state: {},
//   children: {}
// })

class App extends Component {
  constructor(props, context) {
    super(props, context)

    this.state = {
    }
  }

  render() {
    return <NodeUI
      styles={Object.assign({
        padding: "10px 20px"
      }, colors.solarizedDark)}
      root={{
        children: [
          mdtNode,
          dummyNode
        ]
      }}
    />
  }

  // _handleValueChange(value) {
  //   // console.log("value", value)
  //   this.setState({value: value})
  // }
}

export default App
