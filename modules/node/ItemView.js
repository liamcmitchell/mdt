import React from 'react'
import {withIO} from 'react-io'
import compose from 'recompose/compose'

export default compose(
  withIO({
    styles: '/styles'
  })
)(function ItemView({styles, item}) {
  return <div
    style={{
      color: item instanceof Error ? styles.red : undefined,
      padding: styles.padding,
      whiteSpace: 'pre',
    }}
  >
    {
      item === null ? <i>null</i> :
        item === '' ? <i>empty string</i> :
        typeof item === 'boolean' ? <i>{item.toString()}</i> :
        item instanceof Error ? item.toString() :
          item
    }
  </div>
})
