import React, { Component, PropTypes } from 'react'
import { Combinator } from 'react-combinators/rx'
import Focusable from 'components/focusable'
import $ from 'lib/rx'
import _ from 'underscore'
import data from 'client-data'
import * as nodeHelpers from 'lib/node-helpers'

class NodeEdit extends Component {
  constructor(props, context) {
    super(props, context)

    this.state = {
      value: props.item
    }
  }

  render() {
    const props = this.props
    const schema = props.node.schema || {}

    return <input
      type={schema.type === 'number' ? 'number' : 'string'}
      value={this.state.value}
      onChange={this._handleChange.bind(this)}
      onKeyDown={this._handleKeyDown.bind(this)}
      ref={(c) => this.input = c}
      style={{
        padding: props.styles.padding,
        color: this._isValid() ?
          props.styles.primaryColor :
          props.styles.red,
        backgroundColor: props.styles.backgroundHighlightColor
      }}
    />
  }

  componentDidMount(c) {
    this.input.select()
  }

  _isValid() {
    const value = this.state.value
    const schema = this.props.node.schema || {}
    return schema.validator ?
      // Validator should return null if there are no errors.
      !schema.validator(value) :
      true
  }

  _handleChange(event) {
    const schema = this.props.schema || {}
    const value = schema.type === 'number' ?
      +event.target.value :
      event.target.value
    this.setState({value})
  }

  _handleKeyDown(event) {
    if (event.keyCode === 13) {
      this.props.node.onChange(this.state.value)
    }
  }
}

class NodeView extends Component {
  render() {
    const props = this.props
    const item = props.item
    const isFocusable = nodeHelpers.isFocusable(props.node)

    return <Focusable
      el='div'
      focused={props.isFocused}
      href={'/' + props.path.join('/')}
      style={{
        cursor: isFocusable ? 'pointer' : null,
        display: 'block',
        textDecoration: 'none',
        color: props.item instanceof Error ?
          props.styles.red :
          isFocusable ?
            props.styles.primaryColor :
            props.styles.secondaryColor,
        padding: props.styles.padding,
        whiteSpace: 'pre',
        backgroundColor: props.isOnPath ?
          props.styles.backgroundHighlightColor :
          null
      }}
      onClick={(e) => {
        if (isFocusable) {
          data('/path').set('/' + props.path.join('/'))
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

export default class NodeItem extends Component {
  static propTypes = {
    path: PropTypes.array.isRequired,
    styles: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state)
  }

  render() {
    const props = this.props

    const path$ = data('/path').observable()
      .map(path => _.filter(path.split('/')))

    const isFocused$ = path$
      .map(path => _.isEqual(path, props.path))
      .distinctUntilChanged()

    const isOnPath$ = path$
      .map(path => _.isEqual(path.slice(0, props.path.length), props.path))
      .distinctUntilChanged()

    const item$ = $(props.node.item)

    return <Combinator>
      <div
        style={{
          overflow: 'hidden'
        }}
      >
        {$.combineLatest([
          isOnPath$,
          isFocused$,
          data('/editing'),
          item$
        ], (isOnPath, isFocused, editing, item) => {

          // Edit mode
          if (isFocused && editing) {
            return <NodeEdit
              styles={props.styles}
              path={props.path}
              node={props.node}
              item={item}
            />
          }

          // View mode
          else {
            return <NodeView
              styles={props.styles}
              path={props.path}
              node={props.node}
              item={item}
              isOnPath={isOnPath}
              isFocused={isFocused}
            />
          }
        })}
      </div>
    </Combinator>
  }
}
