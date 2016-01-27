import React, { Component } from 'react'
import keycode from 'keycode'
import ObservableComponent from 'components/observable'
import NodeItem from 'components/node-item'
import createHistory from 'history/lib/createBrowserHistory'
import Rx from 'rx'
import _ from 'underscore'
import data from 'client-data'

function asObservable(v) {
  return Rx.Observable.isObservable(v) ? v : Rx.Observable.just(v)
}

function getProp(object, prop) {
  return typeof object[prop] === 'function' ?
    object[prop]() :
    object[prop]
}

function isNode(el) {
  return el && el.item
}

function nodeItem(node) {
  return getProp(node, 'item')
}

function nodeChildren(node) {
  return getProp(node, 'nodes')
}

function nodeChildren$(node$) {
  return node$.flatMapLatest(node => asObservable(nodeChildren(node)))
}

function nodeHandlers(node) {
  return getProp(node, 'handlers')
}

function nodeHandlers$(node$) {
  return node$.flatMapLatest(node => asObservable(nodeHandlers(node)))
}

// Helper for common find arg.
function nodeWithKey(key) {
  return function(node) {
    return isNode(node) && node.key === key
  }
}

function nodeAtPath(node, path) {
  return path.length === 0 ?
    node :
    nodeAtPath(nodeChildWithKey(node, path[0]), path.slice(1))
}

function nodeAtPath$(node$, path) {
  return path.length === 0 ?
    node$ :
    nodeAtPath$(nodeChildWithKey$(node$, path[0]), path.slice(1))
}

function nodeChildWithKey(node, key) {
  return nodeChildren(node).find(nodeWithKey(key))
}

function nodeChildWithKey$(node$, key) {
  return nodeChildren$(node$).map(nodes => nodes.find(nodeWithKey(key)))
}

const log = console.log.bind(console)

class NodeUI extends ObservableComponent {
  static propTypes = {
    // Passed on to item, content & child nodes unless overridden.
    styles: React.PropTypes.object,
    // Root node. Only used for children.
    root: React.PropTypes.object.isRequired
  }

  constructor(props, context) {
    super(props, context)

    // Bind handlers.
    this._handleMouseDown = this._handleMouseDown.bind(this)
    this._handleDoubleClick = this._handleDoubleClick.bind(this)
    this._handleKeyDown = this._handleKeyDown.bind(this)
  }

  observe() {
    const path$ = data.observable('/path').map(path => _.filter(path.split('/')))
    const rootNode$ = asObservable(this.props.root)

    return {
      path: path$,
      // Build the grid of visible nodes from the path.
      levels: path$.flatMapLatest(path =>
        Rx.Observable.combineLatest(
          // Add placeholder for root and map to observable of nodes.
          [].concat(0, path).map((v, i) =>
            nodeChildren$(nodeAtPath$(rootNode$, path.slice(0, i)))
              .startWith([])
          )
        )
      ),
      // For every path, save the last selected child so we can use
      // it as the default when descending into children.
      lastChild: path$.scan((lastChild, path) => {
        path.forEach((key, i) => {
          lastChild[path.slice(0, i).join('/')] = key
        })
        return lastChild
      }, this.data.lastChild || {}),
      handlers: path$.flatMapLatest(path =>
        nodeHandlers$(nodeAtPath$(rootNode$, path))
      )
    }
  }

  render() {
    const { path, levels } = this.data

    if (!levels) {
      return null
    }

    return <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
        backgroundColor: this.props.styles.backgroundColor
      }}
    >
      {levels.map((nodes, i) => {
        const parentPath = path.slice(0, i)
        return <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '100%',
            overflow: 'auto'
          }}
        >
          {nodes.map(node => this._renderNode(node, parentPath))}
        </div>
      })}
    </div>
  }

  _renderNode(node, parentPath) {
    if (typeof node === 'string') {
      node = {key: node, item: node}
    }
    const path = [].concat(parentPath, node.key)
    const isFocusable = !!(node.nodes || node.handlers)
    const isOnPath = isFocusable && this._isOnPath(path)
    const isFocused = isOnPath && _.isEqual(path, this.data.path)
    return <NodeItem
      key={node.key}
      path={path}
      isFocusable={isFocusable}
      isOnPath={isOnPath}
      isFocused={isFocused}
      styles={node.styles || this.props.styles}
      onMouseDown={this._handleMouseDown}
      onDoubleClick={this._handleDoubleClick}
      onKeyDown={this._handleKeyDown}
      item={nodeItem(node)}
    />
  }

  // Optimised path comparison.
  _isOnPath(path) {
    if (path.length > this.data.path.length)
      return false

    for (var i = 0; i < path.length; i++) {
      if (path[i] !== this.data.path[i])
        return false
    }

    return true
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
      case 'left':
        // Move to parent (if there is a parent).
        if (path.length > 1) {
          this._setPath(path.slice(0, -1))
          event.preventDefault()
        }
        break
      case 'right':
        // Move to child.
        const childNodes = this.data.levels[path.length]
        // Check there is a child to go to.
        if (childNodes.length) {
          const lastChildKey = this.data.lastChild[path.join('/')]
          const nextKey = lastChildKey && childNodes.find(nodeWithKey(lastChildKey)) ?
            // Prefer last child if it exists.
            lastChildKey :
            // Otherwise use the first child.
            childNodes[0].key
          this._setPath([].concat(path, nextKey))
          event.preventDefault()
        }
        break
      case 'up':
        // Move to prev sibling.
        this._setPath(path.slice(0, -1).concat(this._getSiblingNode(path, -1).key))
        event.preventDefault()
        break
      case 'down':
        // Move to next sibling.
        this._setPath(path.slice(0, -1).concat(this._getSiblingNode(path, +1).key))
        event.preventDefault()
        break
      default:
        this._tryHandler(path, key, event)  
    }
  }

  _tryHandler(path, name, event) {
    const handlers = this.data.handlers
    if (handlers && handlers[name]) {
      handlers[name](event)
    }
  }

  _getSiblingNode(path, indexIncrement) {
    const siblings = this.data.levels[path.length - 1].filter(isNode)
    const currentIndex = siblings.findIndex(nodeWithKey(path[path.length - 1]))
    var newIndex = currentIndex + indexIncrement
    // Loop to start.
    while (newIndex >= siblings.length) {
      newIndex -= siblings.length
    }
    // Loop to end.
    while (newIndex < 0) {
      newIndex += siblings.length
    }
    return siblings[newIndex]
  }

  _setPath(path) {
    data.set('/path', '/' + path.join('/'))
  }
}

export default NodeUI
