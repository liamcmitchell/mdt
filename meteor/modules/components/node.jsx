import React, { Component } from "react"
import Cursor from "lib/cursor"
import childrenToArray from "lib/childrenToArray"

// Used to avoid overriding handlers with null. 
function omitFalsyProps(obj) {
  const newObj = {}
  Object.keys(obj).forEach(key => {
    if (obj[key]) {
      newObj[key] = obj[key]
    }
  })
  return newObj
}

function elementIsNode(el) {
  return el && el.type && el.type.isNode
}

function elementIsItem(el) {
  return el && el.type && el.type.isNodeItem
}

function elementIsContent(el) {
  return el && el.type && el.type.isNodeContent
}

// A node is a high level abstraction of a recursively nestable UI component.
// A node must contain 
class Node extends Component {
  static isNode = true

  static propTypes = {
    // Flag to prevent passing cursor back to root.
    root: React.PropTypes.bool,
    // Triggers render modes.
    render: React.PropTypes.oneOf(["item", "content"]),
    // Passed as-is to item, child cursors are created for child nodes.
    cursor: React.PropTypes.instanceOf(Cursor),
    // Merged and passed on to both item and child nodes.
    handlers: React.PropTypes.object,
    // Passed on to item, content & child nodes unless overridden.
    styles: React.PropTypes.object
  }

  render() {
    switch (this.props.render) {
      case "item":
        return this._renderItem()
      case "content":
        return this._renderContent()
      default:
        throw new Error("Node render mode not set.")
    }
  }

  componentDidMount() {
    this._updateLastChild()
  }

  componentDidUpdate(prevProps, prevState) {
    this._updateLastChild()
  }

  _renderItem() {
    const item = this._getItem()
    // Extend item merging given props (item.props) with inherited (this.props).
    return React.cloneElement(item, {
      cursor: this.props.cursor,
      handlers: Object.assign({}, this.props.handlers, omitFalsyProps({
        right: this._hasChildNode() ? this._moveCursorToChild.bind(this) : null
      }), item.props.handlers),
      styles: item.props.styles || this.props.styles
    })
  }

  _renderContent() {
    const content = this._getContent()

    if (!content) {
      return null
    }

    const children = childrenToArray(content.props.children)
      .map(this._extendChildNode.bind(this))

    const childOnPath = children.find(child =>
      elementIsNode(child) && child.props.cursor.isOnPath
    )
    const childContent = childOnPath ?
      React.cloneElement(childOnPath, {
        render: "content"
      }) :
      null

    // Extend content merging given props (content.props) with inherited.
    return React.cloneElement(content, {
      childContent,
      styles: content.props.styles || this.props.styles
    }, children)
  }

  _getItem() {
    const item = childrenToArray(this.props.children).find(elementIsItem)

    if (!item) {
      throw new Error("Node must have an item.")
    }

    return item
  }

  _getContent() {
    return childrenToArray(this.props.children).find(elementIsContent)
  }

  _getChildNodes() {
    const content = this._getContent()
    return content ?
      childrenToArray(content.props.children).filter(elementIsNode) :
      []
  }

  _hasChildNode() {
    const content = this._getContent()
    return content &&
      childrenToArray(content.props.children).some(elementIsNode)
  }

  _extendChildNode(element) {
    return elementIsNode(element) ?
      React.cloneElement(element, {
        // Render as item by default.
        render: "item",
        // Flag to prevent left handler moving cursor to root.
        root: false,
        cursor: this.props.cursor.createChild(element.key),
        styles: element.props.styles || this.props.styles,
        handlers: Object.assign({},
          this.props.handlers,
          omitFalsyProps({
            left: this.props.root === false ?
              this._moveCursorHere.bind(this) :
              null,
            up: this._moveCursorToChildSibling.bind(this, element.key, -1),
            down: this._moveCursorToChildSibling.bind(this, element.key, +1)
          }),
          element.props.handlers
        )
      }) :
      element
  }

  _moveCursorHere() {
    this.props.cursor.setPath([])
  }

  _moveCursorToChild() {
    const childNodes = this._getChildNodes()
    const lastChild = childNodes.find(child => child.key === this.lastChild)
    // Prefer last child if it still exists.
    const child = lastChild || childNodes[0]
    this.props.cursor.setPath([child.key])
  }

  _moveCursorToChildSibling(childKey, indexIncrement) {
    const childNodes = this._getChildNodes()

    if (childNodes.length === 0) {
      throw new Error("No child nodes.")
    }

    const index = childNodes.findIndex(child => child.key === childKey)
    var newIndex = index + indexIncrement
    // Loop to start.
    while (newIndex >= childNodes.length) {
      newIndex -= childNodes.length
    }
    // Loop to end.
    while (newIndex < 0) {
      newIndex += childNodes.length
    }

    this.props.cursor.setPath([childNodes[newIndex].key])
  }

  _updateLastChild() {
    const cursor = this.props.cursor
    // Only needed for event handler so don't save in this.state.
    if (cursor && cursor.path && cursor.path[0]) {
      this.lastChild = cursor.path[0]
    }
  }
}

export default Node