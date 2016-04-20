import React, { Component } from 'react'
import NodeUI from 'components/node-ui'
import colors from 'lib/colors'
import sourceInterface from 'source/interface'
import sourceRoutes from 'source/routes'
import sourceAlias from 'source/alias'
import sourceCache from 'source/cache'
import remoteSource from 'sources/remote'
import cursorSource from 'sources/cursor'
import createHistory from 'history/lib/createBrowserHistory'
import nodeSource from 'sources/node'

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
    return <NodeUI
      data={sourceInterface(sourceCache(sourceRoutes({
        server: remoteSource(document.location.origin),
        file: sourceAlias('/server/file'),
        dir: sourceAlias('/server/dir'),
        cursor: cursorSource(createHistory()),
        node: nodeSource
      })))}
      styles={Object.assign({
        padding: '10px 20px'
      }, colors.solarizedDark)}
    />
  }
}

export default App
