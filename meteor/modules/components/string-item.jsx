import React from "react"
import Item from "components/item"
import Text from "components/text"
import StringNode from "components/string-node"

// Used to input string.
export default React.createClass({
  propTypes: {
    value: React.PropTypes.string.isRequired,
    onValueChange: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return {active: false}
  },

  render() {
    // Show input if active, string if not.
    var node = this.state.active ?
      <StringNode
        value={this.props.value}
        onValueChange={this._handleValueChange}
        active={this.state.active}
        onActiveChange={active => this.setState({active})}
        ref="input"
      /> :
      // Show that string is empty.
      (this.props.value === "" ?
        <div
          style={{
            opacity: 0.3,
            padding: "10px"
          }}
        >
          empty
        </div> :
        this.props.value)

    return <Item
      {...this.props}
      node={node}
      keyHandlers={{
        enter: this._handleEnter
      }}
    />
  },

  componentWillReceiveProps(nextProps) {
    // Deactivate when we lose the cursor.
    if (this.props.cursor.value[0] === "#" && nextProps.cursor.value[0] !== "#") {
      this.setState({active: false})
    }
  },

  _handleValueChange(value) {
    this.props.onValueChange(value)
    this.setState({active: false})
  },

  _handleEnter(event) {
    this.setState({active: true})
  }
})
