import React from 'react'
import NodeItem from 'components/NodeItem'
import {nodeWithKey} from 'lib/node-helpers'
import {withIO} from 'react-io'
import compose from 'recompose/compose'
import pure from 'recompose/pure'

export default compose(
  withIO(({path}) => ({
    nodes: `/node/nodes${path}`
  })),
  pure
)(function NodeChildren({io, selected, selectedIsFocused, path, styles, nodes}) {
  const isOptions = !selected
  const isFocused = selectedIsFocused
  const isCompact = selected && !isFocused

  // If the next node isn't there, add a placeholder for error.
  const nodesToRender = selected && !nodes.find(nodeWithKey(selected)) ?
    [{
      key: selected,
      item: new Error(selected + ' not found')
    }].concat(nodes) :
    nodes

  return <div style={{
      backgroundColor: styles.backgroundColor,
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
    onClick={isCompact ?
      () => io('/location', 'REPLACE', {
        pathname: path
      }) :
      null
    }
  >
    {nodesToRender.map(node =>
      <NodeItem
        key={node.key}
        path={`${path}${path === '/' ? '' : '/'}${node.key}`}
        node={node}
        styles={styles}
      />
    )}
  </div>
})
