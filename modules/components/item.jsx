import React from "react"
import wrapCursor from "lib/cursor"
import Text from "components/text"
import keycode from "keycode"

/* Item
Basic unit of MDT UI.

Recursively renders itself in columns & nodes.
Rendering starts with a root item that renders child nodes and children of the selected child.

Keyboard events are captured by setting tabindex="-1" and
maintaining focus on the node div.

Useful for understanding browser keyboard control:
https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets
*/

var Item = React.createClass({
  propTypes: {
    // Key is required for child cursors.
    key: React.PropTypes.string,
    // Cursor is created and passed by wrapCursor component.
    cursor: wrapCursor.propType,
    // Used to switch rendering mode, defaults to "content".
    render: React.PropTypes.oneOf(["node", "content"]),
    // Node is only required when rendering as node.
    node: function(props, propName, componentName) {
      if (props.render === "node") {
        React.PropTypes.oneOfType([
          React.PropTypes.element,
          React.PropTypes.string
        ]).isRequired(props[propName])
      }
    },
    onKeyDown: React.PropTypes.func,
    keyHandlers: React.PropTypes.object
  },

  componentDidMount() {
    this._ensureFocus()
  },

  componentDidUpdate(prevProps, prevState) {
    this._ensureFocus()
  },

  render() {
    return this._isNode() ? this._renderNode() : this._renderContent()
  },

  // Rows are displayed inside parents col.
  // Rows always have a parent and should never have nested items.
  _renderNode() {
    var style = {
      backgroundColor: this._isFocused() ? "blue": "",
      color: this._isFocused() ? "white": ""
    }

    // Allow string shorthand.
    var node = typeof this.props.node === "string" ?
      <Text>
        {this.props.node}
      </Text> :
      this.props.node

    return (
      <div
        ref="node"
        style={style}
        onClick={this._handleNodeClick}
        onDoubleClick={this._handleNodeDoubleClick}
        tabIndex="-1"
        onKeyDown={this._handleKeyDown}
      >
        {node}
      </div>
    )
  },

  // Cols are rendered in parents col.
  // Cols are the recursive shell.
  // Cols may have child nodes, may have a child col and may have a parent.
  _renderContent() {
    var children = this._getChildren()
    var selectedChild = children.find(child =>
      child && child.props && child.props.cursor && child.props.cursor.isOnFocusedPath
    )

    var childrenNodes = children.map(child => {
      if (typeof child === "string") {
        return <Text>{child}</Text>
      }
      else if (child.key) {
        return this._renderChildNode(child)
      }
      else {
        return child
      }
    })
    var childContent = selectedChild ? this._renderChildContent(selectedChild) : null

    return <div
      style={{
        display: "flex",
        flexDirection: "row"
      }}
      onKeyDown={this._handleKeyDown}
    >
      <div style={{
        display: "flex",
        flexDirection: "column",
        minWidth: 200
      }}>
        {childrenNodes}
      </div>
      {childContent}
    </div>
  },

  // These events are fired from the currently selected node or child of the node.
  _handleKeyDown(event) {
    // console.log(keycode(event));

    // Let parent override...?
    if (this.props.onKeyDown) {
      this.props.onKeyDown(event)
      return
    }

    // Use human readable key name.
    const key = keycode(event)
    // Props can override direction keys.
    const defaultHandlers = {
      left: () => this.props.cursor.focusParent(),
      up: () => this.props.cursor.focusPrevSibling(),
      right: () => this.props.cursor.focusChild(),
      down: () => this.props.cursor.focusNextSibling()
    }
    const propHandlers = this.props.keyHandlers || {}
    const handler = propHandlers[key] || defaultHandlers[key]

    if (handler) {
      handler(event)
      event.stopPropagation()
    }
  },

  _handleNodeClick(event) {
    // Click brings focus.
    if (!this._isFocused()) {
      this.props.cursor.focusSelf()
    }
  },

  _handleNodeDoubleClick(event) {
    // Double click fires enter handler if exists.
    if (this.props.keyHandlers && this.props.keyHandlers.enter) {
      this.props.keyHandlers.enter(event)
      event.preventDefault()
    }
  },

  _ensureFocus() {
    // Make sure there is a focused element that we can catch events from.
    if (this._isNode() && this._isFocused() && !this.refs.node.contains(document.activeElement)) {
      this.refs.node.focus()
    }
  },

  _isNode() {
    return this.props.render === "node"
  },

  _renderChildNode(child) {
    return React.cloneElement(child, {
      render: "node"
    })
  },

  _renderChildContent(child) {
    return React.cloneElement(child, {
      render: "content"
    })
  },

  // Children.toArray is available with React 0.14.
  _getChildren() {
    var children = []
    React.Children.forEach(this.props.children, child => children.push(child))
    return children.filter(child => child)
  },

  _isFocused() {
    return this.props.cursor.isFocused
  }
})

export default wrapCursor(Item)
