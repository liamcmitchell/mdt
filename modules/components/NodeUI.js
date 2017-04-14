import React, {Component} from 'react'
import keycode from 'keycode'
import NodeChildren from 'components/NodeChildren'
import {isFocusable, nodeWithKey} from 'lib/node-helpers'
import getLoopingArrayItem from 'lib/getLoopingArrayItem'
import {withIO} from 'react-io' 
import filter from 'lodash/filter'
import last from 'lodash/last'
import uniqBy from 'lodash/uniqBy'
import flatten from 'lodash/flatten'
import find from 'lodash/find'
import compose from 'recompose/compose'

const pathToArray = p => filter(p.split('/'))
const arrayToPath = a => '/' + a.join('/')
const pathParent = p => arrayToPath(pathToArray(p).slice(0, -1))
const pathKey = p => last(pathToArray(p))

// Turn path into array of paths including root (empty) and original.
function pathToSubPaths(path) {
  const array = pathToArray(path)
  return [[]]
    .concat(array.map((v, i) => array.slice(0, i + 1)))
    .map(arrayToPath)
}

export default compose(
  withIO({
    location: '/location'
  }),
  withIO(({location: {pathname}}) => {
    return {
      node: `/node/node${pathname}`,
      nodeHandlers: `/node/handlers${pathname}`,
      siblings: `/node/nodes${pathParent(pathname)}`,
      children: `/node/nodes${pathname}`
    }
  })
)(class NodeUI extends Component {
  render() {
    const {io, styles, location: {pathname: path, search}, node, siblings, children, nodeHandlers} = this.props

    const editing = Boolean(search)

    // Used to record last child visited for each node.
    this.lastChildStore = this.lastChildStore || {}

    const setPath = pathname =>
      io('/location', 'REPLACE', {
        pathname: pathname.replace(/^\/\//, '/')
      })

    const upDownFn = event => {
      const key = keycode(event)
      const keys = siblings.filter(isFocusable).map(n => n.key)
      // Siblings may be empty if there is a bad url (we still show error).
      if (keys.length) {
        const nextIndex = keys.includes(pathKey(path)) ?
          // If the current key exists, we want a key relative to it.
          keys.indexOf(pathKey(path)) + (key === 'up' ? -1 : +1) :
          // Otherwise pick the first or last key.
          key === 'up' ? -1 : 0
        const nextKey = getLoopingArrayItem(keys, nextIndex)
        setPath(pathParent(path) + (path === '/' ? '' : '/') + nextKey)
      }
    }

    const navHandlers = [

      // Edit
      !node.onChange ? null : {
        key: 'enter',
        label: 'edit',
        fn: () => io('/location', 'REPLACE', {
          search: true
        })
      },

      // Left
      path === '/' ? null : {
        key: 'left',
        fn: () => setPath(pathParent(path))
      },

      // Up/down
      [
        {key: 'up', fn: upDownFn},
        {key: 'down', fn: upDownFn}
      ],

      // Right
      {
        key: 'right',
        fn: () => {
          // First save the current path.
          const array = pathToArray(path)
          array.forEach((key, i) => {
            this.lastChildStore[arrayToPath(array.slice(0, i))] = key
          })

          const focusable = children.filter(isFocusable)
          if (focusable.length === 0) return null
          const lastChildKey = this.lastChildStore[path]
          const lastChild = focusable.find(nodeWithKey(lastChildKey))
          // Prefer last child if it exists, otherwise use the first.
          const childKey = lastChild ? lastChild.key : focusable[0].key

          setPath(path + (path === '/' ? '' : '/') + childKey)
        }
      },

      // Node
      nodeHandlers

    ]

    const editHandlers = [
      // Cancel
      {
        key: 'esc',
        label: 'cancel',
        fn: () => io('/location', 'REPLACE', {
          search: false
        })
      },

      // Save
      {
        key: 'enter',
        label: 'save',
        fn: () => io('/location', 'REPLACE', {
          search: false
        })
      }
    ]

    const handlers = 
      // Ignore duplicate keys, first come, first used.
      // TODO: How will overriding parents keys work?
      uniqBy(filter(flatten(editing ? editHandlers : navHandlers)), 'key')

    return <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: styles.backgroundColor
      }}
      onKeyDown={event => {
        // Handle double clicks as enter.
        const key = event.type === 'dblclick' ? 'enter' : keycode(event)
        const handler = find(handlers, {key})
        if (handler) {
          handler.fn(event)
          event.preventDefault()
        }
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1
        }}
      >
        {do {
          const subPaths = pathToSubPaths(path)
          const array = pathToArray(path)
          subPaths.map((subPath, i) =>
            <NodeChildren
              key={subPath}
              path={subPath}
              styles={styles}
              selected={array[i]}
              selectedIsFocused={array.length === i + 1}
            />
          )
        }}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexShrink: 0,
          backgroundColor: styles.backgroundHighlightColor
        }}
      >
        {handlers
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
        }
      </div>
    </div>
  }
})
