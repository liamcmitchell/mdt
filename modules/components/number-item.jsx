import React from "react"

// Used to input number.
export default React.createClass({
  propTypes: {
    value: React.PropTypes.number.isRequired,
    onValueChange: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      value: this.props.value,
      editing: false
    }
  },

  render() {
    return this.state.active ?
      <input
        type="number"
        value={this.props.value}
        onChange={this._handleInputChange}
        onKeyDown={this._handleInputKeyDown}
        ref="input"
      /> :
      this.props.value + ""
  },

  _handleInputChange(event) {
    // Pass new value up.
    this.props.onValueChange(+event.target.value)
  },

  _handleInputKeyDown(event) {
    // Enter
    if (event.keyCode === 13) {
      this.props.deactivate()
      event.stopPropagation()
    }
  },

  _handleEnter() {
    this.setState({active: true})
    this.refs.input.select()
  }
})
