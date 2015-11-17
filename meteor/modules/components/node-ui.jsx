import React, { Component } from "react"
import Immutable from "immutable"
import keycode from "keycode"
import Node from "components/node"
import createHistory from 'history/lib/createBrowserHistory'

function getProp(object, prop) {
  return typeof object[prop] === "function" ?
    object[prop]() :
    object[prop]
}

function isNode(el) {
  return el && el.item
}

function nodeItem(node) {
  return getProp(node, "item")
}

function nodeChildren(node) {
  return getProp(node, "children")
}

function nodeHandlers(node) {
  return getProp(node, "handlers")
}

function findNode(items, key) {
  return items.find(item =>
    isNode(item) && item.key === key
  )
}

function findNodeFromPath(node, path) {
  return path[0] ?
    findNodeFromPath(findNode(nodeChildren(node), path[0]), path.slice(1)) :
    node
}

class NodeUI extends Component {
  static propTypes = {
    // Passed on to item, content & child nodes unless overridden.
    styles: React.PropTypes.object,
    // Root node. Only used for children.
    root: React.PropTypes.object.isRequired
  }

  constructor(props, context) {
    super(props, context)

    this.state = {
      path: Immutable.List()
    }

    // Bind handlers.
    this._handleMouseDown = this._handleMouseDown.bind(this)
    this._handleDoubleClick = this._handleDoubleClick.bind(this)
    this._handleKeyDown = this._handleKeyDown.bind(this)
    this._handleHistoryChange = this._handleHistoryChange.bind(this)
  }

  componentWillMount() {
    this._history = createHistory()
    this._unlisten = this._history.listen(this._handleHistoryChange)
  }

  componentWillUnmount() {
    this._unlisten()
  }

  render() {
    const path = this.state.path

    // Build tree of items to be rendered.
    const levels = [nodeChildren(this.props.root)]
    path.toJS().forEach((key, depth) => {
      const nextNode = levels[depth] && findNode(levels[depth], key)
      if (nextNode) {
        levels.push(nodeChildren(nextNode))
      }
    })

    return <div
      style={{
        display: "flex",
        flexDirection: "row",
        flex: 1,
        backgroundColor: this.props.styles.backgroundColor
      }}
    >
      {levels.map((items, depth) => {
        return <div
          key={depth}
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: "100%",
            overflow: "auto"
          }}
        >
          {items.map(item => this._renderItem(item, path.take(depth)))}
        </div>
      })}
    </div>
  }

  _renderItem(item, parentPath) {
    if (isNode(item)) {
      const path = parentPath.push(item.key)

      return <Node
        key={item.key}
        path={path}
        isFocused={path.equals(this.state.path)}
        isOnPath={path.equals(this.state.path.take(path.size))}
        styles={item.styles || this.props.styles}
        onMouseDown={this._handleMouseDown}
        onDoubleClick={this._handleDoubleClick}
        onKeyDown={this._handleKeyDown}
        item={nodeItem(item)}
      />
    }
    else if (typeof item === "string") {
      // Give plain strings standard padding.
      return <div
        key={item}
        style={{
          padding: this.props.styles.padding,
          color: this.props.styles.secondaryColor
        }}
      >
        {item}
      </div>
    }
    else {
      return item
    }
  }

  _handleMouseDown(path, event) {
    // Bring cursor here.
    this._setPath(path)
  }

  _handleDoubleClick(path, event) {
    this._tryHandler(path, 'enter', event)
  }

  _handleKeyDown(path, event) {
    const key = keycode(event)

    switch (key) {
      case "left":
        // Move to parent (if there is a parent).
        if (path.size > 1) {
          this._setPath(path.butLast())
          event.preventDefault()
        }
        break
      case "right":
        // Move to child.
        const childNodes = this._getChildNodes(path)
        // Check there is a child to go to.
        if (childNodes.length) {
          // Prefer last child.
          const lastChildKey = this.lastChild.get(path)
          this._setPath(path.push(
            findNode(childNodes, lastChildKey) ?
              // Use last child if it exists.
              lastChildKey :
              // Fall back to first child.
              childNodes[0].key
          ))
          event.preventDefault()
        }
        break
      case "up":
        // Move to prev sibling.
        this._setPath(path.splice(-1, 1, this._getSiblingNode(path, -1).key))
        event.preventDefault()
        break
      case "down":
        // Move to next sibling.
        this._setPath(path.splice(-1, 1, this._getSiblingNode(path, +1).key))
        event.preventDefault()
        break
      default:
        this._tryHandler(path, key, event)  
    }
  }

  _tryHandler(path, name, event) {
    const handlers = this._getHandlers(path)
    if (handlers[name]) {
      handlers[name](event)
    }
  }

  _getHandlers(path) {
    return nodeHandlers(this._getNode(path))
  }

  _getNode(path) {
    const node = findNodeFromPath(this.props.root, path.toJS())
    if (!node) {
      throw new Error("Node not found for path " + path.toJS().join("/"))
    }
    return node
  }

  _getChildNodes(path) {
    return nodeChildren(this._getNode(path)).filter(isNode)
  }

  _getSiblingNode(path, indexIncrement) {
    const siblings = Immutable.List(this._getChildNodes(path.butLast()))
    const currentIndex = siblings.findIndex(node => node.key === path.last())
    var newIndex = currentIndex + indexIncrement
    // Loop to start.
    while (newIndex >= siblings.size) {
      newIndex -= siblings.size
    }
    // Loop to end.
    while (newIndex < 0) {
      newIndex += siblings.size
    }
    return siblings.get(newIndex)
  }

  _handleHistoryChange({ pathname }) {
    const path = Immutable.List(pathname.slice(1).split("/"))
    // TODO: Check path is valid before setting it.
    // It may come from user.
    this._updateLastChild(path)
    this.setState({path})
  }

  _setPath(path) {
    if (!Immutable.List.isList(path)) {
      throw new Error("Path must be immutable list.")
    }
    this._history.replaceState(null, "/" + path.toJS().join("/"))
  }

  _updateLastChild(path) {
    // Last child is a map of child keys, keyed by path (list).
    // When updating, we update all ancestors, not just first parent.
    this.lastChild = Immutable.Map(this.lastChild).merge(
      path.map((key, i) => [path.take(i), key])
    )
  }
}

export default NodeUI
