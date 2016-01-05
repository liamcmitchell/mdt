import React from "react"
import PropTypes from "lib/proptypes"
import Input from "components/input"
import StringNode from "components/string-node"
import keycode from "keycode"

// Used to input object property name and value.
export default React.createClass({
  propTypes: {
    object: React.PropTypes.object.isRequired,
    name: React.PropTypes.string.isRequired,
    onNameChange: React.PropTypes.func.isRequired,
    value: PropTypes.JSON,
    onValueChange: React.PropTypes.func.isRequired,
    onDelete: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return {active: false}
  },

  render() {
    var node = this.state.active ?
      <StringNode
        active={this.state.active}
        onActiveChange={active => this.setState({active})}
        value={this.props.name}
        onValueChange={this.props.onNameChange}
        validator={this._validateName}
        ref="input"
      /> :
      this.props.name + ":"

    return (
      <Input
        {...this.props}
        key={"key:" + this.props.key}
        node={node}
        keyHandlers={{
          enter: () => this.setState({active: true}),
          backspace: this.props.onDelete
        }}
        value={this.props.value}
        onValueChange={this.props.onValueChange}
      />
    )
  },

  componentWillReceiveProps(nextProps) {
    // Deactivate when we lose the cursor.
    if (this.props.cursor.value[0] === "#" && nextProps.cursor.value[0] !== "#") {
      this.setState({active: false})
    }
  },

  _validateName(name) {
    // Valid if the same as before or there is no duplicate.
    return name === this.props.name ||
      !this.props.object.hasOwnProperty(name)
  }
})
