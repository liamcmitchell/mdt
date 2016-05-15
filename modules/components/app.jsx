import React, { Component } from 'react'

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
    return this.props.children
  }
}

export default App
