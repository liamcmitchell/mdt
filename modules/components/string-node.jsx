import React from "react"
import keycode from "keycode"

// TODO: Do inputs pass intermediate values up?
// Or are they kept in state until finished which allows cancel.
// Does validation work with intermediate or finished values?
export default React.createClass({
  propTypes: {
    active: React.PropTypes.bool.isRequired,
    onActiveChange: React.PropTypes.func.isRequired,
    value: React.PropTypes.string.isRequired,
    onValueChange: React.PropTypes.func.isRequired,
    validator: React.PropTypes.func
  },

  getDefaultProps() {
    return {
      validator(value) { return true }
    }
  },

  getInitialState() {
    return { value: this.props.value }
  },

  render() {
    return <input
      style={{
        padding: "10px",
        backgroundColor: this.props.validator(this.state.value) ? "green" : "red",
        width: "100%"
      }}
      type="text"
      value={this.state.value}
      onChange={this._handleChange}
      onKeyDown={this._handleKeyDown}
      ref="input"
    />
  },

  componentDidMount() {
    if (this.props.active) {
      this._activate()
    }
  },

  componentWillReceiveProps(nextProps) {
    // Update local value on activate and deactivate.
    if (this.props.active !== nextProps.active) {
      this.setState({value: nextProps.value})
    }
  },

  componentDidUpdate(prevProps, prevState) {
    if (this.props.active && !prevProps.active) {
      this._activate()
    }
  },

  _activate() {
    this.refs.input.select()
  },

  _handleChange(event) {
    this.setState({value: event.target.value})
  },

  _handleKeyDown(event) {
    const key = keycode(event)

    if (key === "esc") {
      this.props.onActiveChange(false)
    }
    else if (key === "enter") {
      this.props.onValueChange(this.state.value)
    }

    event.stopPropagation()
  }
})
