import React, {Component} from 'react'
import Focusable from 'components/Focusable'
import {isFocusable} from 'lib/node-helpers'

export default class NodeView extends Component {
  render() {
    const {io, item, isFocused, path, styles, isOnPath, node} = this.props
    const focusable = isFocusable(node)

    return <Focusable
      el='div'
      focused={isFocused}
      href={path}
      style={{
        cursor: focusable ? 'pointer' : null,
        display: 'block',
        textDecoration: 'none',
        color: item instanceof Error ?
          styles.red :
          focusable ?
            styles.primaryColor :
            styles.secondaryColor,
        padding: styles.padding,
        whiteSpace: 'pre',
        backgroundColor: isFocused || isOnPath ?
          styles.backgroundHighlightColor :
          null
      }}
      onClick={(e) => {
        if (focusable) {
          io('/location', 'REPLACE', {
            pathname: path
          })
        }
        e.preventDefault()
      }}
    >
      {
        item === null ? <i>null</i> :
        item === '' ? <i>empty</i> :
        typeof item === 'boolean' ? <i>{item.toString()}</i> :
        item instanceof Error ? item.toString() :
          item
      }
    </Focusable>
  }
}