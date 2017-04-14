import React, {Component} from 'react'
import {withIO} from 'react-io'
import NodeView from 'components/NodeView'
import compose from 'recompose/compose'
import pure from 'recompose/pure'

export default compose(
  withIO(({path}) => ({
    location: '/location',
    item: `/node/item${path}`
  })),
  pure
)(class NodeItem extends Component {
  render() {
    const {io, path, node, styles, location: {pathname}, item} = this.props

    const isFocused = pathname === path
    const isOnPath = pathname.indexOf(path + '/') === 0

    return <div style={{
        overflow: 'hidden'
      }}
    >
      <NodeView
        io={io}
        styles={styles}
        path={path}
        node={node}
        item={item}
        isOnPath={isOnPath}
        isFocused={isFocused}
      />
    </div>
  }
})
