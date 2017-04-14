import React, {Component} from 'react'
import {IOProvider} from 'react-io'
import {createIO} from 'url-io'
import NodeUI from 'components/NodeUI'
import colors from 'lib/colors'
import source from 'source/client'

const io = createIO(source)

export default class App extends Component {
  render() {
    return <IOProvider io={io}>
      <NodeUI styles={{
        padding: '10px 20px',
        ...colors.solarizedDark
      }} />
    </IOProvider>
  }
}
