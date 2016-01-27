import React, { Component } from "react"
import NodeUI from "components/node-ui"
import colors from "lib/colors"
import mdtNode from "nodes/mdt"
import dummyNode from "nodes/dummy"

import Test from 'components/test'

class App extends Component {
  componentWillMount() {
    // Disable history.back on backspace, noone needs that.
    document.addEventListener('keydown', function(e) {
      if (e.keyCode === 8 && !e.target.nodeName.toLowerCase().match(/input|textarea/)) {
        e.preventDefault()
      }
    })

  }

  render() {
    return <NodeUI
      styles={Object.assign({
        padding: "10px 20px"
      }, colors.solarizedDark)}
      root={{
        nodes: [
          mdtNode,
          dummyNode
        ]
      }}
    />
  }

  // render() {
  //   return <Test text="yo dawg" />
  // }
}

export default App
