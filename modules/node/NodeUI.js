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
import times from 'lodash/times'
import compose from 'recompose/compose'
import withProps from 'recompose/withProps'

const arrayToPath = (a) => a.join('/')

export default compose(
  withIO({
    location: '/location',
    styles: '/styles',
  }),
  withProps(({location: {pathname}}) => ({
    path: pathname.slice(1),
    pathPieces: pathname
      .slice(1)
      .split('/')
      .filter(Boolean),
  })),
  withIO(({io, path, pathPieces, location: {search}}) => {
    return {
      nodeHandlers: io(`/node/handlers/${path}`, search),
      siblings: `/node/children/${pathPieces.slice(0, -1).join('/')}`,
      children: `/node/children/${path}`,
    }
  })
)(
  class NodeUI extends Component {
    setPathPieces(pathPieces) {
      const {io} = this.props

      io('/location', 'REPLACE', {pathname: `/${pathPieces.join('/')}`})
    }

    handleEscape = () => {
      const {pathPieces} = this.props
      this.setPathPieces(pathPieces)
    }

    handleLeft = () => {
      const {pathPieces} = this.props
      const parent = pathPieces.slice(0, -1)

      if (parent.length) {
        this.setPathPieces(parent)
      }
    }

    handleUpDown = (event) => {
      const {pathPieces, siblings} = this.props
      const key = keycode(event)
      const keys = siblings.filter(isFocusable).map((n) => n.key)

      // Siblings may be empty if there is a bad url (we still show error).
      if (keys.length) {
        const currentKey = decodeURIComponent(last(pathPieces))
        const nextIndex = keys.includes(currentKey)
          ? // If the current key exists, we want a key relative to it.
            keys.indexOf(currentKey) + (key === 'up' ? -1 : +1)
          : // Otherwise pick the first or last key.
            key === 'up' ? -1 : 0
        const nextKey = getLoopingArrayItem(keys, nextIndex)
        this.setPathPieces(
          pathPieces.slice(0, -1).concat(encodeURIComponent(nextKey))
        )
      }
    }

    handleRight = () => {
      const {pathPieces, children} = this.props
      const focusable = children.filter(isFocusable)

      if (focusable.length === 0) return null

      this.setPathPieces(
        pathPieces.concat(encodeURIComponent(focusable[0].key))
      )
    }

    getNavHandlers() {
      const {location: {search: {mode}}} = this.props

      if (mode) {
        return [
          {
            key: 'esc',
            label: 'escape',
            fn: this.handleEscape,
          },
        ]
      }

      return [
        {
          key: 'left',
          fn: this.handleLeft,
        },
        {
          key: 'up',
          fn: this.handleUpDown,
        },
        {
          key: 'down',
          fn: this.handleUpDown,
        },
        {
          key: 'right',
          fn: this.handleRight,
        },
      ]
    }

    getHandlers() {
      const {nodeHandlers} = this.props
      const navHandlers = this.getNavHandlers()

      // Ignore duplicate keys, first come, first served.
      return uniqBy(filter(navHandlers.concat(nodeHandlers)), 'key')
    }

    handleKeyDown = (event) => {
      // Handle double clicks as enter.
      const key = event.type === 'dblclick' ? 'enter' : keycode(event)
      const handler = find(this.getHandlers(), {key})
      if (handler) {
        handler.fn(event)
        event.preventDefault()
      }
    }

    render() {
      const {styles, pathPieces} = this.props

      // Turn path into array of paths including root (empty) and original.
      const subPaths = times(pathPieces.length + 1)
        .map((i) => pathPieces.slice(0, i))
        .map(arrayToPath)

      return (
        <div
          onKeyDown={this.handleKeyDown}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            backgroundColor: styles.backgroundColor,
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flex: 1,
              zIndex: 1,
            }}
          >
            {subPaths.map((subPath, i) => (
              <NodeChildren
                key={subPath}
                path={subPath}
                activeKey={decodeURIComponent(pathPieces[i] || '')}
                activeIsFocused={pathPieces.length === i + 1}
              />
            ))}
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
              .filter((handler) => !!handler.label)
              .map((handler) => (
                <div
                  key={handler.key}
                  style={{
                    padding: styles.padding,
                    color: styles.primaryColor,
                  }}
                >
                  <span
                    style={{
                      backgroundColor: styles.backgroundColor,
                      padding: 6,
                      marginRight: 10,
                      borderRadius: 4,
                    }}
                  >
                    {handler.key}
                  </span>
                  {handler.label}
                </div>
              ))}
          </div>
        </div>
      )
    }
  }
)
