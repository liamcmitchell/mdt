import React, { Component } from 'react'
import keycode from 'keycode'
import { Combinator } from 'react-combinators/rx'
import NodeChildren from 'components/node-children'
import Rx from 'rx'
import _ from 'underscore'
import $ from 'lib/rx'
import { isFocusable, nodeWithKey } from 'lib/node-helpers'
import wrapFn from 'lib/wrapFn'
import getLoopingArrayItem from 'lib/getLoopingArrayItem'
import {withIO} from 'react-io' 

// Turn path into array of paths including root (empty) and original.
function pathToSubPaths(path) {
  return [[]].concat(path.map((v, i) => path.slice(0, i + 1)))
}

class NodeUI extends Component {
  static propTypes = {
    // Passed on to item, content & child nodes unless overridden.
    styles: React.PropTypes.object
  }

  render() {
    // Used to record last child visited for each node.
    this.lastChildStore = this.lastChildStore || {}
    const {io, styles} = this.props

    function setPath(path) {
      io('/cursor/path').set(path)
    }

    // Get prototype methods
    const path$ = Rx.Observable.merge(io('/cursor/path'))

    const navHandlers$ = $.combineLatest([

      // Edit
      path$
        .flatMapLatest(path => io(['node', 'node'].concat(path)))
        .map(node => {
          return node.onChange ? {
            key: 'enter',
            label: 'edit',
            fn: () => io('/cursor/editing').set(true)
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
        siblings: path$.flatMapLatest(path =>
          io(['node', 'nodes'].concat(path.slice(0, -1)))
        )
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
        children: path$
          .flatMapLatest(path => io(['node', 'nodes'].concat(path)))
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
      path$
        .flatMapLatest(path => io(['node', 'handlers'].concat(path)))

    ])

    const editHandlers$ = $.combineLatest([
      // Cancel
      $({
        key: 'esc',
        label: 'cancel',
        fn: () => io('/cursor/editing').set(false)
      }),

      // Save
      $({
        key: 'enter',
        label: 'save',
        fn: () => io('/cursor/editing').set(false)
      })
    ])

    const handlers$ = $.combineLatest([
      io('/cursor/editing'),
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
    .startWith([])

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
      .startWith(() => {})

    return <Combinator>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          backgroundColor: styles.backgroundColor
        }}
        onKeyDown={handleKeyDown$}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flex: 1
          }}
        >
          {path$.map(path =>
            pathToSubPaths(path).map((subPath, i) =>
              <NodeChildren
                key={subPath.join('/')}
                path={subPath}
                styles={styles}
                selected={path[i]}
                selectedIsFocused={path.length === i + 1}
              />
            )
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexShrink: 0,
            backgroundColor: styles.backgroundHighlightColor
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
                  padding: styles.padding,
                  color: styles.primaryColor
                }}
              >
                <span
                  style={{
                    backgroundColor: styles.backgroundColor,
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

export default withIO(NodeUI)
