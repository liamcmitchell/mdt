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

// Access items in an array as if it looped infinitely.
function getLoopingArrayItem(array, index) {
  if (!array) throw new Error('Array required')
  if (array.length === 0) return undefined
  // Loop to start.
  while (index >= array.length) {
    index -= array.length
  }
  // Loop to end.
  while (index < 0) {
    index += array.length
  }
  return array[index]
}

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

  observe(props) {
    const path$ = data.observable('/path').map(path => _.filter(path.split('/')))
    const nodeAt$ = nodeAtPath$.bind(null, asObservable(props.root))
    const focusedNode$ = path$.flatMapLatest(nodeAt$)

    return {
      path: path$,
      // Handlers for selected node.
      handlers: focusedNode$
        .flatMapLatest(nodeHandlers$)
        // Path may not point to valid node.
        .catch(Rx.Observable.just([])),
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
        flexDirection: 'column',
        flex: 1,
        backgroundColor: this.props.styles.backgroundColor
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1
        }}
      >
        {pathToSubPaths(path).map((subPath, i) =>
          <NodeChildren
            key={subPath.join('/')}
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexShrink: 0,
          backgroundColor: this.props.styles.backgroundHighlightColor
        }}
      >
        {_.map(this.data.handlers, this._renderHandler.bind(this))}
      </div>
    </div>
  }

  _renderHandler(handler) {
    return <div
      key={handler.key}
      style={{
        padding: this.props.styles.padding,
        color: this.props.styles.primaryColor
      }}
    >
      <span
        style={{
          backgroundColor: this.props.styles.backgroundColor,
          padding: 6,
          marginRight: 10,
          borderRadius: 4
        }}
      >
        {handler.key}
      </span>
      {handler.label || 'action'}
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
          this._setPath(path.concat(nextKey))
          event.preventDefault()
        }
        break
      case 'up':
      case 'down':
        const path = this.data.path
        const currentKey = path[path.length - 1]
        const keys = this.data.siblings.filter(isFocusable).map(n => n.key)
        // Siblings may be empty if there is a bad url (we still show error).
        if (keys.length) {
          this._setPath(path.slice(0, -1).concat(
            getLoopingArrayItem(keys, _.contains(keys, currentKey) ?
              // If the current key exists, we want a key relative to it.
              keys.indexOf(currentKey) + (key === 'up' ? -1 : +1) :
              // Otherwise pick the first or last key.
              key === 'up' ? -1 : 0
            )
          ))
        }
        event.preventDefault()
        break
      default:
        this._tryHandler(path, key, event)  
    }
  }

  _tryHandler(path, name, event) {
    const handler = (this.data.handlers || []).find(h => h.key === name)
    if (handler) handler.fn(event)
  }

  _setPath(path) {
    data.set('/path', '/' + path.join('/'))
  }
}

class NodeChildren extends ObservableComponent {

  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextProps.selected !== this.props.selected ||
      nextProps.selectedIsFocused !== this.props.selectedIsFocused ||
      nextProps.root !== this.props.root ||
      nextProps.styles !== this.props.styles ||
      !_.isEqual(nextProps.path, this.props.path)
    )
  }

  observe(props) {
    const { root, path, selected } = props
    return {
      nodes: nodeAtPath$(asObservable(root), path)
        // Get children.
        .flatMapLatest(nodeChildren$)
        // Show dummy node if there was an error getting the nodes.
        // TODO: This dummy node isn't available to parent so the up/down kb handler
        // doesn't know which node to pass focus to.
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
            nodes = [dummy].concat(nodes)
          }
          return nodes
        })
    }
  }

  render() {
    const nodes = this.data.nodes || []
    const isOptions = !this.props.selected
    const isFocused = this.props.selectedIsFocused
    const isCompact = this.props.selected && !isFocused
    return <div
      style={{
        backgroundColor: this.props.styles.backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        maxHeight: '100%',
        overflow: isCompact ? 'hidden' : 'auto',
        transition: 'all 0.2s',
        width: isCompact ?
          10 :
          isFocused ? 200 : 'auto',
        flexGrow: isOptions ? 1 : 0,
        flexShrink: isOptions ? 1 : 0,
        boxShadow: '-2px 0 2px 0 rgba(0, 0, 0, 0.2)',
        cursor: isCompact ? 'pointer' : null
      }}
      onClick={isCompact ? this._handleClick.bind(this) : null}
    >
      {nodes.map(node => this._renderNode(node))}
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
      item={node.item}
      onMouseDown={props.onMouseDown}
      onDoubleClick={props.onDoubleClick}
      onKeyDown={props.onKeyDown}
    />
  }

  _handleClick(event) {
    this.props.onMouseDown(this.props.path, event)
  }
}

export default NodeUI
