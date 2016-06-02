import React, { Component } from 'react'
import { Combinator } from 'react-combinators/rx'
import NodeItem from 'components/node-item'
import _ from 'underscore'
import $ from 'lib/rx'
import { nodeWithKey } from 'lib/node-helpers'
import {withIO} from 'react-io'

class NodeChildren extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state)
  }

  render() {
    const {io, selected, selectedIsFocused, path, styles} = this.props

    const isOptions = !selected
    const isFocused = selectedIsFocused
    const isCompact = selected && !isFocused

    const nodes$ = io(['node', 'nodes'].concat(path))
      .map(nodes => {
        // If the next node isn't there, add a placeholder for error.
        if (selected && !nodes.find(nodeWithKey(selected))) {
          const dummy = {
            key: selected,
            item: new Error(selected + ' not found')
          }
          nodes = [dummy].concat(nodes)
        }
        return nodes
      })

    return <Combinator>
      <div
        style={{
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
          () => io('/cursor/path').set(path) :
          null
        }
      >
        {nodes$.map(nodes => nodes.map(node => {
          return <NodeItem
            key={node.key}
            path={path.concat(node.key)}
            node={node}
            styles={styles}
          />
        }))}
      </div>
    </Combinator>
  }
}

export default withIO(NodeChildren)
