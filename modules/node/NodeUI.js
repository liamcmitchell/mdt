import React, {Component} from 'react'
import keycode from 'keycode'
import NodeChildren from 'node/NodeChildren'
import {isFocusable} from 'lib/node-helpers'
import getLoopingArrayItem from 'lib/getLoopingArrayItem'
import {withIO} from 'react-io' 
import filter from 'lodash/filter'
import last from 'lodash/last'
import uniqBy from 'lodash/uniqBy'
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
    location: '/location',
    styles: '/styles'
  }),
  withIO(({io, location: {pathname, search}}) => {
    return {
      nodeHandlers: io(`/node/handlers${pathname}`, search),
      siblings: `/node/children${pathParent(pathname)}`,
      children: `/node/children${pathname}`
    }
  })
)(class NodeUI extends Component {
  setPath(pathname) {
    const {io} = this.props

    io('/location', 'REPLACE', {
      pathname: pathname.replace(/^\/\//, '/')
    })
  }

  handleEscape = () => {
    const {location: {pathname}} = this.props
    this.setPath(pathname)
  }

  handleLeft = () => {
    const {location: {pathname}} = this.props
    const parent = pathParent(pathname)

    if (parent !== '/') {
      this.setPath(parent)
    }
  }

  handleUpDown = event => {
    const {location: {pathname}, siblings} = this.props
    const key = keycode(event)
    const keys = siblings.filter(isFocusable).map(n => n.key)

    // Siblings may be empty if there is a bad url (we still show error).
    if (keys.length) {
      const nextIndex = keys.includes(pathKey(pathname)) ?
        // If the current key exists, we want a key relative to it.
        keys.indexOf(pathKey(pathname)) + (key === 'up' ? -1 : +1) :
        // Otherwise pick the first or last key.
        key === 'up' ? -1 : 0
      const nextKey = getLoopingArrayItem(keys, nextIndex)
      this.setPath(pathParent(pathname) + (pathname === '/' ? '' : '/') + nextKey)
    }
  }

  handleRight = () => {
    const {location: {pathname}, children} = this.props
    const focusable = children.filter(isFocusable)

    if (focusable.length === 0) return null

    this.setPath(pathname + (pathname === '/' ? '' : '/') + focusable[0].key)
  }

  getNavHandlers() {
    const {location: {search: {mode}}} = this.props

    if (mode) {
      return [{
        key: 'esc',
        label: 'escape',
        fn: this.handleEscape
      }]
    }

    return [
      {
        key: 'left',
        fn: this.handleLeft
      },
      {
        key: 'up',
        fn: this.handleUpDown
      },
      {
        key: 'down',
        fn: this.handleUpDown
      },
      {
        key: 'right',
        fn: this.handleRight
      },
    ]
  }

  getHandlers() {
    const {nodeHandlers} = this.props
    const navHandlers = this.getNavHandlers()

    // Ignore duplicate keys, first come, first served.
    return uniqBy(filter(navHandlers.concat(nodeHandlers)), 'key')
  }

  handleKeyDown = event => {
    // Handle double clicks as enter.
    const key = event.type === 'dblclick' ? 'enter' : keycode(event)
    const handler = find(this.getHandlers(), {key})
    if (handler) {
      handler.fn(event)
      event.preventDefault()
    }
  }

  render() {
    const {styles, location: {pathname}} = this.props
    const subPaths = pathToSubPaths(pathname)
    const pathPieces = pathToArray(pathname)

    return <div
      onKeyDown={this.handleKeyDown}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: styles.backgroundColor,
        position: 'relative'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1,
          zIndex: 1
        }}
      >
        {subPaths.map((subPath, i) =>
          <NodeChildren
            key={subPath}
            path={subPath}
            activeKey={pathPieces[i]}
            activeIsFocused={pathPieces.length === i + 1}
          />
        )}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          flex: '0 0 auto',
          backgroundColor: styles.backgroundHighlightColor,
          boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.4)',
          zIndex: 2,
          // minHeight: 35
        }}
      >
        {this.getHandlers()
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
