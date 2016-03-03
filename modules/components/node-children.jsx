import React, { Component } from 'react'
import { Combinator } from 'react-combinators/rx'
import NodeItem from 'components/node-item'
import _ from 'underscore'
import $ from 'lib/rx'
import * as nodeHelpers from 'lib/node-helpers'
import data from 'client-data'

export default class NodeChildren extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state)
  }

  render() {
    const props = this.props

    const isOptions = !props.selected
    const isFocused = props.selectedIsFocused
    const isCompact = props.selected && !isFocused

    const nodes$ = nodeHelpers.nodeAtPath$($(props.root), props.path)
      // Get children.
      .flatMapLatest(nodeHelpers.nodeChildren$)
      .map(nodes => {
        // If the next node isn't there, add a placeholder for error.
        if (props.selected && !nodes.find(nodeHelpers.nodeWithKey(props.selected))) {
          const dummy = {
            key: props.selected,
            item: new Error(props.selected + ' not found')
          }
          nodes = [dummy].concat(nodes)
        }
        return nodes
      })

    return <Combinator>
      <div
        style={{
          backgroundColor: props.styles.backgroundColor,
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
          () => data('/path').set('/' + props.path.join('/')) :
          null
        }
      >
        {nodes$.map(nodes => nodes.map(node => {
          return <NodeItem
            key={node.key}
            path={props.path.concat(node.key)}
            node={node}
            styles={props.styles}
          />
        }))}
      </div>
    </Combinator>
  }
}
