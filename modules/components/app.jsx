import React, {Component} from 'react'
import {createIO, IOProvider} from 'react-io'
import NodeUI from 'components/node-ui'
import colors from 'lib/colors'
import source from '../../client-source'

const io = createIO(source)

class App extends Component {
  componentWillMount() {
    // Disable history.back on backspace, noone needs that.
    this._handleKeydown = (e) => {
      if (e.keyCode === 8 && !e.target.nodeName.toLowerCase().match(/input|textarea/)) {
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', this._handleKeydown)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this._handleKeydown)
  }

  render() {
    return <IOProvider io={io}>
      <NodeUI
        styles={Object.assign({
          padding: '10px 20px'
        }, colors.solarizedDark)}
      />
    </IOProvider>
  }
}

export default App
