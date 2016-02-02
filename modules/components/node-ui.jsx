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

function isNode(el) {
  return el && el.item
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
  return path.length === 0 ?
    // If there are no more pieces to the path, return current node.
    node$ :
    // Otherwise, continue with the next child.
    nodeAtPath$(nodeChild$(node$, path[0]), path.slice(1))
      .catch(Rx.Observable.throw(
        new Error('Unable to find node at path ' + path.join('/'))
      ))
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

    return {
      path: path$,
      siblings: path$.flatMapLatest(path =>
        nodeAtPath$(asObservable(this.props.root), path.slice(0, -1))
          .flatMapLatest(nodeChildren$)
          // Path may not point to valid node.
          .catch(Rx.Observable.just([]))
      ),
      children: path$.flatMapLatest(path =>
        nodeAtPath$(asObservable(this.props.root), path)
          .flatMapLatest(nodeChildren$)
          // Path may not point to valid node.
          .catch(Rx.Observable.just([]))
      ),
      // For every path, save the last selected child so we can use
      // it as the default when descending into children.
      lastChild: path$.scan((lastChild, path) => {
        path.forEach((key, i) => {
          lastChild[path.slice(0, i).join('/')] = key
        })
        return lastChild
      }, this.data.lastChild || {}),
      // Handlers for selected node.
      handlers: path$.flatMapLatest(path =>
        nodeAtPath$(asObservable(this.props.root), path)
          .flatMapLatest(nodeHandlers$)
          // Path may not point to valid node.
          .catch(Rx.Observable.just({}))
      )
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
        <NodeCol
          key={i}
          path={path}
          subPath={subPath}
          nextKey={path[i]}
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
        const children = this.data.children
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
    const nodes = this.data.siblings.filter(isNode)
    const currentIndex = nodes.findIndex(nodeWithKey(path[path.length - 1]))
    var newIndex = currentIndex + indexIncrement
    // Loop to start.
    while (newIndex >= nodes.length) {
      newIndex -= nodes.length
    }
    // Loop to end.
    while (newIndex < 0) {
      newIndex += nodes.length
    }
    return nodes[newIndex]
  }

  _setPath(path) {
    data.set('/path', '/' + path.join('/'))
  }
}

class NodeCol extends ObservableComponent {
  observe(props) {
    const { root, subPath, nextKey } = props
    return {
      nodes: nodeAtPath$(asObservable(root), subPath)
        // Get children.
        .flatMapLatest(nodeChildren$)
        // Starting with an empty array means that levels will update
        // immediately, even if there is not yet data to display.
        .startWith([])
        // Show dummy node if there was an error getting the nodes.
        .catch(err => {
          console.error(err)
          return asObservable([{
            key: '',
            item: Rx.Observable.throw(
              new Error("Can't find children for " + subPath.join('/'))
            )
          }])
        })
        .map(nodes => {
          // If the next node isn't there, add a placeholder for error.
          if (nextKey && !nodes.find(nodeWithKey(nextKey))) {
            const dummy = {
              key: nextKey,
              item: Rx.Observable.throw(new Error(nextKey + ' not found'))
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
      {this.data.nodes.map(node => this._renderNode(node))}
    </div>
  }

  _renderNode(node) {
    const props = this.props
    const path = [].concat(props.subPath, node.key)
    const isOnPath = props.nextKey === node.key
    const isFocused = isOnPath && path.length === props.path.length
    return <NodeItem
      key={node.key}
      path={path}
      isFocusable={node.focusable !== false}
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
