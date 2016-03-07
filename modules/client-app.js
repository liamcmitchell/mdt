import React, { Component } from 'react'
import NodeUI from 'components/node-ui'
import colors from 'lib/colors'
import rootNode from 'nodes/root'
import data from 'client-data'

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
      data={data}
      styles={Object.assign({
        padding: '10px 20px'
      }, colors.solarizedDark)}
      root={rootNode}
    />
  }
}

export default App
