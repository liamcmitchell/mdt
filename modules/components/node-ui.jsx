import React, { Component } from 'react'
import keycode from 'keycode'
import { Combinator } from 'react-combinators/rx'
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
function $(v) {
  return Rx.Observable.isObservable(v) ? v : Rx.Observable.just(v)
}

function isNode(node) {
  return node && node.key && node.item
}

function isFocusable(node) {
  return node && node.focusable !== false
}

function getProp(prop, fallback, object) {
  return object.hasOwnProperty(prop) ?
    typeof object[prop] === 'function' ?
      object[prop]() :
      object[prop] :
    fallback
}

function getProp$(prop, fallback, object$) {
  return Rx.Observable.isObservable(object$) ?
    object$.flatMapLatest(object =>
      $(getProp(prop, fallback, object))
    ) :
    $(getProp(prop, fallback, object$))
}

const nodeItem$ = getProp$.bind(null, 'item', null)
const nodeChildren$ = getProp$.bind(null, 'nodes', [])
const nodeHandlers$ = getProp$.bind(null, 'handlers', [])

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

    // Used to record last child visited for each node.
    this.lastChild = {}
  }

  observe(props) {
    const path$ = data.observable('/path').map(path => _.filter(path.split('/')))
    const nodeAt$ = nodeAtPath$.bind(null, $(props.root))
    const focusedNode$ = path$.flatMapLatest(nodeAt$)

    // Need to push observables needed for event handlers/callbacks, into
    // the render tree. Observables can return functions. This could be optimised by
    // returning a wrapper function that always calls the latest fn returned from it's
    // observable. Don't get carried away with this though.

    return {
      // Path is still used in event handlers
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
    const props = this.props
    const path$ = data.observable('/path').map(path => _.filter(path.split('/')))
    const nodeAt$ = nodeAtPath$.bind(null, $(props.root))
    const focusedNode$ = path$.flatMapLatest(nodeAt$)
    const focusedNodeHandlers$ = focusedNode$
      .flatMapLatest(nodeHandlers$)
      // Path may not point to valid node.
      .catch(Rx.Observable.just([]))
    // Siblings of current node. needed for up/down navigation.
    const siblings$ = path$
      .map(path => path.slice(0, -1))
      .flatMapLatest(nodeAt$)
      .flatMapLatest(nodeChildren$)
      // Path may not point to valid node.
      .catch(Rx.Observable.just([]))
    // Children of current node. Needed for right navigation.
    const children$ = focusedNode$
      .flatMapLatest(nodeChildren$)
      // Path may not point to valid node.
      .catch(Rx.Observable.just([]))
    // For every path, save the last selected child so we can use
    // it as the default when descending into children.
    const lastChild$ = path$.scan((lastChild, path) => {
      path.forEach((key, i) => {
        lastChild[path.slice(0, i).join('/')] = key
      })
      return lastChild
    }, this.lastChild)

    const handleDoubleClick$ = focusedNodeHandlers$.map(handlers => (path, event) => {
      console.log('doubleclick', path, event, handlers)
      const handler = _.findWhere(handlers, {key: 'enter'})
      if (handler) {
        handler.fn(event)
        event.preventDefault()
      }
    })

    const handleKeyDown$ = Rx.Observable.combineLatest(
      [path$, siblings$, focusedNodeHandlers$, children$, lastChild$],
      (path, siblings, handlers, children, lastChild) => {
        console.log(path, siblings, handlers, children, lastChild)
        return (path, event) => {
          const data = {path, siblings, handlers, children, lastChild}
          const upDownFn = (event) => {
            const key = keycode(event)
            const path = data.path
            const currentKey = path[path.length - 1]
            const keys = data.siblings.filter(isFocusable).map(n => n.key)
            // Siblings may be empty if there is a bad url (we still show error).
            if (keys.length) {
              setPath(path.slice(0, -1).concat(
                getLoopingArrayItem(keys, _.contains(keys, currentKey) ?
                  // If the current key exists, we want a key relative to it.
                  keys.indexOf(currentKey) + (key === 'up' ? -1 : +1) :
                  // Otherwise pick the first or last key.
                  key === 'up' ? -1 : 0
                )
              ))
            }
          }
          const handlers = (data.handlers || []).concat([
            {
              key: 'left',
              fn: () => {
                if (path.length > 1) {
                  setPath(path.slice(0, -1))
                }
              }
            },
            {
              key: 'right',
              fn: () => {
                // Move to child.
                const children = (data.children || []).filter(isFocusable)
                // Check there is a child to go to.
                if (children.length) {
                  const lastChildKey = data.lastChild[path.join('/')]
                  const nextKey = lastChildKey && children.find(nodeWithKey(lastChildKey)) ?
                    // Prefer last child if it exists.
                    lastChildKey :
                    // Otherwise use the first child.
                    children[0].key
                  setPath(path.concat(nextKey))
                }
              }
            },
            {key: 'up', fn: upDownFn},
            {key: 'down', fn: upDownFn}
          ])

          const handler = _.findWhere(handlers, {key: keycode(event)})
          if (handler) {
            handler.fn(event)
            event.preventDefault()
          }
        }
      }
    )


    return <Combinator>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          backgroundColor: props.styles.backgroundColor
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flex: 1
          }}
        >
          {Rx.Observable.combineLatest(
            [path$, handleDoubleClick$, handleKeyDown$],
            (path, handleDoubleClick, handleKeyDown) =>
              pathToSubPaths(path).map((subPath, i) =>
                <NodeChildren
                  key={subPath.join('/')}
                  path={subPath}
                  selected={path[i]}
                  selectedIsFocused={path.length === i + 1}
                  root={props.root}
                  styles={props.styles}
                  onMouseDown={setPath}
                  onDoubleClick={handleDoubleClick}
                  onKeyDown={handleKeyDown}
                />
              )
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexShrink: 0,
            backgroundColor: props.styles.backgroundHighlightColor
          }}
        >
          {focusedNodeHandlers$.map(handlers =>
            handlers.map(h => renderHandler(props, h))
          )}
        </div>
      </div>
    </Combinator>
  }

  // Requires: path, siblings, handlers, children, lastchild
  _handleKeyDown(path, event) {
    const upDownFn = (event) => {
      const key = keycode(event)
      const path = this.data.path
      const currentKey = path[path.length - 1]
      const keys = this.data.siblings.filter(isFocusable).map(n => n.key)
      // Siblings may be empty if there is a bad url (we still show error).
      if (keys.length) {
        setPath(path.slice(0, -1).concat(
          getLoopingArrayItem(keys, _.contains(keys, currentKey) ?
            // If the current key exists, we want a key relative to it.
            keys.indexOf(currentKey) + (key === 'up' ? -1 : +1) :
            // Otherwise pick the first or last key.
            key === 'up' ? -1 : 0
          )
        ))
      }
    }
    const handlers = (this.data.handlers || []).concat([
      {
        key: 'left',
        fn: () => {
          if (path.length > 1) {
            setPath(path.slice(0, -1))
          }
        }
      },
      {
        key: 'right',
        fn: () => {
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
            setPath(path.concat(nextKey))
          }
        }
      },
      {key: 'up', fn: upDownFn},
      {key: 'down', fn: upDownFn}
    ])

    const handler = _.findWhere(handlers, {key: keycode(event)})
    if (handler) {
      handler.fn(event)
      event.preventDefault()
    }
  }
}

function setPath(path) {
  data.set('/path', '/' + path.join('/'))
}

function renderHandler(props, handler) {
  return <div
    key={handler.key}
    style={{
      padding: props.styles.padding,
      color: props.styles.primaryColor
    }}
  >
    <span
      style={{
        backgroundColor: props.styles.backgroundColor,
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
      nodes: nodeAtPath$($(root), path)
        // Get children.
        .flatMapLatest(nodeChildren$)
        // Show dummy node if there was an error getting the nodes.
        // TODO: This dummy node isn't available to parent so the up/down kb handler
        // doesn't know which node to pass focus to.
        .catch(err => {
          console.error(err)
          return $([{
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
