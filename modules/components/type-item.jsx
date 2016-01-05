import React from "react"
import Item from "components/item"

// Used to select data types.
export default React.createClass({
  propTypes: {
    value: React.PropTypes.string.isRequired,
    onValueChange: React.PropTypes.func.isRequired,
    types: React.PropTypes.arrayOf(React.PropTypes.string).isRequired
  },

  getInitialState() {
    return { active: false }
  },

  render() {
    var node = "[" + this.props.value + "]"
    if (this.state.active) {
      node = <div
        style={{padding: "10px"}}
      >
        <select
          style={{
            width: "100%"
          }}
          value={this.props.value}
          onChange={this._handleChange}
          ref="select"
        >
          {this.props.types.map(type =>
            <option key={type} value={type}>{type}</option>
          )}
        </select>
      </div>
    }

    return (
      <Item {...this.props}
        node={node}
        keyHandlers={{
          enter: this._handleEnter,
          up: this.state.active ? () => {} : null,
          down: this.state.active ? () => {} : null
        }}
      />
    )
  },

  componentWillReceiveProps(nextProps) {
    // Deactivate when we lose the cursor.
    if (this.props.cursor.value[0] === "#" && nextProps.cursor.value[0] !== "#") {
      this.setState({active: false})
    }
  },

  componentDidUpdate(prevProps, prevState) {
    if (this.state.active) {
      this.refs.select.focus()
    }
  },

  _handleChange(event) {
    // Pass new value up.
    this.props.onValueChange(event.target.value)
    // Deactivate.
    this.setState({active: false})
  },

  _handleEnter() {
    if (!this.state.active) {
      this.setState({active: true})
    }
  }
})
