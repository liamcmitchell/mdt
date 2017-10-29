import React, {Component} from 'react'
import {IOProvider} from 'react-io'
import NodeUI from 'node/NodeUI'
import io from 'io'

export default class MDTApp extends Component {
  render() {
    return <IOProvider io={io}>
      <NodeUI />
    </IOProvider>
  }
}
