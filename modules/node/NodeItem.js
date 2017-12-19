import React from 'react'
import {withIO} from 'react-io'
import compose from 'recompose/compose'
import pure from 'recompose/pure'
import Focusable from 'components/Focusable'
import branch from 'recompose/branch'
import ItemView from 'node/ItemView'

// Wrapper around single node item.
// Needs to handle dom focus.
export default compose(
  pure,
  // When node is focused, we want to subscribe to location so we can
  // use query params in our item request.
  branch(
    ({isFocused}) => isFocused,
    withIO({
      location: '/location'
    })
  ),
  withIO(({io, path, location: {search} = {}}) => ({
    item: io(`/node/item/${path}`, search),
    focusable: `/node/focusable/${path}`,
    styles: '/styles'
  })),
  pure
)(function NodeItem({
  io, path, styles, focusable = true, isFocused, isActive, item
}) {
  return <Focusable
    el='div'
    focused={isFocused}
    href={`/${path}`}
    style={{
      cursor: focusable ? 'pointer' : null,
      color: focusable ?
        styles.primaryColor :
        styles.secondaryColor,
      backgroundColor: isFocused || isActive ?
        styles.backgroundHighlightColor :
        null
    }}
    onClick={(e) => {
      if (focusable && !isFocused) {
        io('/location', 'REPLACE', {
          pathname: `${path}`,
        })
      }
      e.preventDefault()
    }}
  >
    {
      React.isValidElement(item) ?
        item :
        <ItemView item={item} />
    }
  </Focusable>
})
