import React, { Component } from 'react'
import keycode from 'keycode'
import { Combinator } from 'react-combinators/rx'
import NodeItem from 'components/node-item'
import Rx from 'rx'
import _ from 'underscore'
import $ from 'lib/rx'
import data from 'client-data'
import wrapFn from 'lib/wrapFn'
import getLoopingArrayItem from 'lib/getLoopingArrayItem'

// Turn path into array of paths including root (empty) and original.
function pathToSubPaths(path) {
  return [[]].concat(path.map((v, i) => path.slice(0, i + 1)))
}

function isNode(node) {
  return node && node.hasOwnProperty('key') && node.hasOwnProperty('item')
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
  return $.isObservable(object$) ?
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

function setPath(path) {
  data('/path').set('/' + path.join('/'))
}

class NodeUI extends Component {
  static propTypes = {
    // Passed on to item, content & child nodes unless overridden.
    styles: React.PropTypes.object,
    // Root node. Only used for children.
    root: React.PropTypes.object.isRequired
  }

  render() {
    // Used to record last child visited for each node.
    this.lastChildStore = this.lastChildStore || {}
    const props = this.props

    const path$ = data('/path').observable()
      .map(path => _.filter(path.split('/')))

    const nodeAt$ = nodeAtPath$.bind(null, $(props.root))
    const focusedNode$ = path$.flatMapLatest(nodeAt$)

    const navHandlers$ = $.combineLatest([

      // Edit
      focusedNode$
        .map(node => {
          return node.onChange ? {
            key: 'enter',
            label: 'edit',
            fn: () => data('/editing').set(true)
          } : null
        }),

      // Left
      path$
        .map(path => path.length === 1 ? null : {
          key: 'left',
          fn: () => setPath(path.slice(0, -1))
        }),

      // Up/down
      $.combineLatest({
        path: path$,
        siblings: path$
          .map(path => path.slice(0, -1))
          .flatMapLatest(nodeAt$)
          .flatMapLatest(nodeChildren$)
          // Path may not point to valid node.
          .catch($([]))
      }, ({path, siblings}) => {
        // Handler is used by both up & down.
        const fn = (event) => {
          const key = keycode(event)
          const currentKey = path[path.length - 1]
          const keys = siblings.filter(isFocusable).map(n => n.key)
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
        return [
          {key: 'up', fn: fn},
          {key: 'down', fn: fn}
        ]
      }),

      // Right
      $.combineLatest({
        path: path$,
        children: focusedNode$
          .flatMapLatest(nodeChildren$)
          // Path may not point to valid node.
          .catch($([]))
      }, ({path, children}) => {
        // First save the current path.
        path.forEach((key, i) => {
          this.lastChildStore[path.slice(0, i).join('/')] = key
        })

        const focusable = children.filter(isFocusable)
        if (focusable.length === 0) return null
        const lastChildKey = this.lastChildStore[path.join('/')]
        const lastChild = focusable.find(nodeWithKey(lastChildKey))
        // Prefer last child if it exists, otherwise use the first.
        const childKey = lastChild ? lastChild.key : focusable[0].key

        return {
          key: 'right',
          fn: () => setPath(path.concat(childKey))
        }
      })
      .startWith([]),

      // Node
      focusedNode$
        .flatMapLatest(nodeHandlers$)
        // Path may not point to valid node.
        .catch($([]))

    ])

    const editHandlers$ = $.combineLatest([
      // Cancel
      $({
        key: 'esc',
        label: 'cancel',
        fn: () => data('/editing').set(false)
      }),

      // Save
      $({
        key: 'enter',
        label: 'save',
        fn: () => data('/editing').set(false)
      })
    ])

    const handlers$ = $.combineLatest([
      data('/editing'),
      navHandlers$,
      editHandlers$
    ], (editing, nav, edit) =>
      _.chain(editing ? edit : nav)
        .flatten()
        .filter()
        // Ignore duplicate keys, first come, first used.
        // TODO: How will overriding parents keys work?
        .uniq(handler => handler.key)
        .value()
    )

    const handleKeyDown$ = handlers$
      .map(handlers => {
        return (event) => {
          // Handle double clicks as enter.
          const key = event.type === 'dblclick' ? 'enter' : keycode(event)
          const handler = _.findWhere(handlers, {key})
          if (handler) {
            handler.fn(event)
            event.preventDefault()
          }
        }
      })
      // Return a wrapper function that won't trigger rerender.
      .scan(wrapFn).distinctUntilChanged()

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
          {$.combineLatest([path$, handleKeyDown$], (path, handleKeyDown) =>
            pathToSubPaths(path).map((subPath, i) =>
              <NodeChildren
                key={subPath.join('/')}
                path={subPath}
                selected={path[i]}
                selectedIsFocused={path.length === i + 1}
                root={props.root}
                styles={props.styles}
                onMouseDown={setPath}
                onDoubleClick={handleKeyDown}
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
          {handlers$.map(handlers =>
            handlers
            // Only show handlers with a label.
            .filter(handler => !!handler.label)
            .map(handler =>
              <div
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
                {handler.label}
              </div>
            )
          )}
        </div>
      </div>
    </Combinator>
  }
}

class NodeChildren extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state)
  }

  render() {
    const props = this.props

    const isOptions = !props.selected
    const isFocused = props.selectedIsFocused
    const isCompact = props.selected && !isFocused

    const nodes$ = nodeAtPath$($(props.root), props.path)
      // Get children.
      .flatMapLatest(nodeChildren$)
      // Show dummy node if there was an error getting the nodes.
      .catch(err => {
        console.error(err)
        return $([{
          key: '',
          item: $.throw(
            new Error("Can't find children for " + props.path.join('/'))
          )
        }])
      })
      .map(nodes => {
        // If the next node isn't there, add a placeholder for error.
        if (props.selected && !nodes.find(nodeWithKey(props.selected))) {
          const dummy = {
            key: props.selected,
            item: $.throw(new Error(props.selected + ' not found'))
          }
          nodes = [dummy].concat(nodes)
        }
        return nodes
      })

    return <Combinator>
      <div
        style={{
          backgroundColor: props.styles.backgroundColor,
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
        onClick={isCompact ? setPath.bind(null, props.path) : null}
      >
        {nodes$.map(nodes => nodes.map(node => {
          const nodePath = props.path.concat(node.key)
          const isOnPath = props.selected === node.key
          const isFocused = isOnPath && props.selectedIsFocused
          return <NodeItem
            key={node.key}
            path={nodePath}
            isFocusable={isFocusable(node)}
            isOnPath={isOnPath}
            isFocused={isFocused}
            styles={node.styles || props.styles}
            node={node}
            onMouseDown={props.onMouseDown}
            onDoubleClick={props.onDoubleClick}
            onKeyDown={props.onKeyDown}
          />
        }))}
      </div>
    </Combinator>
  }
}

export default NodeUI
