import React, { Component } from 'react'
import keycode from 'keycode'
import ObservableComponent from 'components/observable'
import NodeItem from 'components/node-item'
import createHistory from 'history/lib/createBrowserHistory'
import Rx from 'rx'
import _ from 'underscore'
import data from 'client-data'

// Turn path into array of paths including root (empty) and original.
function pathToSubPaths(path) {
  return [[]].concat(path.map((v, i) => path.slice(0, i + 1)))
}

// Turn object into observable if it isn't already.
function asObservable(v) {
  return Rx.Observable.isObservable(v) ? v : Rx.Observable.just(v)
}

function getProp(prop, object) {
  return typeof object[prop] === 'function' ?
    object[prop]() :
    object[prop]
}

function getProp$(prop, object$) {
  return asObservable(object$).flatMapLatest(object =>
    asObservable(getProp(prop, object))
  )
}

function isNode(node) {
  return node && node.key && node.item
}

function isFocusable(node) {
  return node && node.focusable !== false
}

const nodeItem$ = getProp$.bind(null, 'item')
const nodeChildren$ = getProp$.bind(null, 'nodes')
const nodeHandlers$ = getProp$.bind(null, 'handlers')

// Helper for common find arg.
function nodeWithKey(key) {
  return function(node) {
    return isNode(node) && node.key === key
  }
}

function nodeAtPath$(node$, path) {
  return path.reduce(nodeChild$, node$)
}

function nodeChild$(node$, key) {
  return node$
    .flatMapLatest(nodeChildren$)
    .map(children => {
      const child = children.find(nodeWithKey(key))
      if (child)
        return child
      else
        throw new Error('Child with key "' + key + '" not found')
    })
}

// To get prev or next item in array.
function getSibling(array, item, indexIncrement) {
    const currentIndex = array.indexOf(item)
    if (currentIndex === -1) {
      return item
    }
    var newIndex = currentIndex + indexIncrement
    // Loop to start.
    while (newIndex >= array.length) {
      newIndex -= array.length
    }
    // Loop to end.
    while (newIndex < 0) {
      newIndex += array.length
    }
    return array[newIndex]
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
    const nodeAt$ = nodeAtPath$.bind(null, asObservable(this.props.root))
    const focusedNode$ = path$.flatMapLatest(nodeAt$)

    return {
      path: path$,
      // Handlers for selected node.
      handlers: focusedNode$
        .flatMapLatest(nodeHandlers$)
        // Path may not point to valid node.
        .catch(Rx.Observable.just({})),
      // Children of current node. Needed for right navigation.
      // TODO: This triggers render but isn't actually used in render.
      children: focusedNode$
        .flatMapLatest(nodeChildren$)
        // Path may not point to valid node.
        .catch(Rx.Observable.just([])),
      // Siblings of current node. needed for up/down navigation.
      // TODO: This triggers render but isn't actually used in render.
      siblings: path$
        .map(path => path.slice(0, -1))
        .flatMapLatest(nodeAt$)
        .flatMapLatest(nodeChildren$)
        // Path may not point to valid node.
        .catch(Rx.Observable.just([])),
      // For every path, save the last selected child so we can use
      // it as the default when descending into children.
      lastChild: path$.scan((lastChild, path) => {
        path.forEach((key, i) => {
          lastChild[path.slice(0, i).join('/')] = key
        })
        return lastChild
      }, this.data.lastChild || {})
    }
  }

  render() {
    const { path } = this.data

    return <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
        backgroundColor: this.props.styles.backgroundColor
      }}
    >
      {pathToSubPaths(path).map((subPath, i) =>
        <NodeChildren
          key={i}
          path={subPath}
          selected={path[i]}
          selectedIsFocused={path.length === i + 1}
          root={this.props.root}
          styles={this.props.styles}
          onMouseDown={this._handleMouseDown}
          onDoubleClick={this._handleDoubleClick}
          onKeyDown={this._handleKeyDown}
        />
      )}
    </div>
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
        const children = (this.data.children || []).filter(isFocusable)
        // Check there is a child to go to.
        if (children.length) {
          const lastChildKey = this.data.lastChild[path.join('/')]
          const nextKey = lastChildKey && children.find(nodeWithKey(lastChildKey)) ?
            // Prefer last child if it exists.
            lastChildKey :
            // Otherwise use the first child.
            children[0].key
          this._setPath([].concat(path, nextKey))
          event.preventDefault()
        }
        break
      case 'up':
        // Move to prev sibling.
        this._setPath(path.slice(0, -1).concat(this._getSiblingNode(path, -1)))
        event.preventDefault()
        break
      case 'down':
        // Move to next sibling.
        this._setPath(path.slice(0, -1).concat(this._getSiblingNode(path, +1)))
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
    return getSibling(this.data.siblings.filter(isFocusable).map(n => n.key), path[path.length - 1], indexIncrement)
  }

  _setPath(path) {
    data.set('/path', '/' + path.join('/'))
  }
}

class NodeChildren extends ObservableComponent {

  shouldComponentUpdate(prevProps, prevState) {
    return (
      prevProps.selected !== this.props.selected ||
      prevProps.selectedIsFocused !== this.props.selectedIsFocused ||
      prevProps.root !== this.props.root ||
      prevProps.styles !== this.props.styles ||
      !_.isEqual(prevProps.path, this.props.path)
    )
  }

  observe(props) {
    const { root, path, selected } = props
    return {
      nodes: nodeAtPath$(asObservable(root), path)
        // Get children.
        .flatMapLatest(nodeChildren$)
        // Show dummy node if there was an error getting the nodes.
        .catch(err => {
          console.error(err)
          return asObservable([{
            key: '',
            item: Rx.Observable.throw(
              new Error("Can't find children for " + path.join('/'))
            )
          }])
        })
        .map(nodes => {
          // If the next node isn't there, add a placeholder for error.
          if (selected && !nodes.find(nodeWithKey(selected))) {
            const dummy = {
              key: selected,
              item: Rx.Observable.throw(new Error(selected + ' not found'))
            }
            nodes = _.sortBy([].concat(nodes, dummy), 'key')
          }
          // Convert plain strings to nodes.
          nodes = nodes.map(node => typeof node === 'object' ? node : {
            key: node,
            item: node,
            focusable: false
          })
          return nodes
        })
    }
  }

  render() {
    return <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        overflow: 'auto'
      }}
    >
      {(this.data.nodes || []).map(node => this._renderNode(node))}
    </div>
  }

  _renderNode(node) {
    const props = this.props
    const path = [].concat(props.path, node.key)
    const isOnPath = props.selected === node.key
    const isFocused = isOnPath && props.selectedIsFocused
    return <NodeItem
      key={node.key}
      path={path}
      isFocusable={isFocusable(node)}
      isOnPath={isOnPath}
      isFocused={isFocused}
      styles={node.styles || props.styles}
      item={nodeItem$(node)}
      onMouseDown={props.onMouseDown}
      onDoubleClick={props.onDoubleClick}
      onKeyDown={props.onKeyDown}
    />
  }
}

export default NodeUI
