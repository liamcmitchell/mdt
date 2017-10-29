import React from 'react'
import NodeItem from 'node/NodeItem'
import {nodeWithKey} from 'lib/node-helpers'
import {withIO} from 'react-io'
import compose from 'recompose/compose'
import pure from 'recompose/pure'

export default compose(
  pure,
  withIO(({path}) => ({
    children: `/node/children${path}`,
    styles: '/styles'
  })),
  pure
)(function NodeChildren({io, activeKey, activeIsFocused, path, styles, children}) {
  // These nodes are the children of the current focused node.
  const isFocusedChildren = !activeKey
  const isFocusedFamily = activeIsFocused
  // This is an ancestor of the focused node and should be hidden.
  const isFocusedAncestor = activeKey && !isFocusedFamily

  // If the next node isn't there, add a placeholder for error.
  const childrenToRender = activeKey && !children.find(nodeWithKey(activeKey)) ?
    [{
      key: activeKey,
      item: new Error(activeKey + ' not found')
    }].concat(children) :
    children

  return <div style={{
      backgroundColor: styles.backgroundColor,
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      maxHeight: '100%',
      transition: 'all 0.2s',
      boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.4)',
      overflow: 'hidden',
      ...(
        // Left of focused.
        isFocusedAncestor ? {
          minWidth: 10,
          maxWidth: 10,
          cursor: 'pointer',
          flex: '0 1 auto'
        } :
        // Focused col.
        isFocusedFamily ? {
          minWidth: 200,
          flex: '0 0 auto'
        } :
        // Right of focused.
        isFocusedChildren ? {
          minWidth: 40,
          flex: '1 1 0'
        } :
        null
      )
    }}
    onClick={isFocusedAncestor ?
      () => io('/location', 'REPLACE', {
        pathname: path
      }) :
      null
    }
  >
    {childrenToRender.map(({key}) =>
      <NodeItem
        key={key}
        path={`${path}${path === '/' ? '' : '/'}${key}`}
        isActive={activeKey === key}
        isFocused={activeKey === key && activeIsFocused}
      />
    )}
  </div>
})
