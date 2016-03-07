import React, { Component, PropTypes } from 'react'
import { Combinator } from 'react-combinators/rx'
import Focusable from 'components/focusable'
import $ from 'lib/rx'
import _ from 'underscore'
import * as nodeHelpers from 'lib/node-helpers'
import validate from 'lib/validate'

class NodeEdit extends Component {
  constructor(props, context) {
    super(props, context)

    this.state = {
      value: props.node.value || props.value
    }
  }

  render() {
    const props = this.props
    const data = props.data
    const schema = props.node.schema || {}

    return this._isSelect() ?
      <div
        style={{
          padding: props.styles.padding,
          backgroundColor: props.styles.backgroundHighlightColor
        }}
      >
        <select
          style={{
            width: "100%"
          }}
          value={this.state.value}
          onChange={this._handleChange.bind(this)}
          onKeyDown={this._handleKeyDown.bind(this)}
          ref={(c) => this.input = c}
        >
          {schema.enum.map((val, k) =>
            <option key={k} value={val}>{val}</option>
          )}
        </select>
      </div> :
      <input
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
    if (this._isSelect()) {
      this.input.focus()
    }
    else {
      this.input.select()
    }
  }

  _isValid() {
    const result = validate(this._value(), this._schema())
    if (result.errors.length) {
      // TODO: Show user these. If I want to show them in the status bar...
      // all this logic needs to be pulled out of this component.
      // console.log('validation errors', result.errors)
    }
    return result.valid
  }

  _isSelect() {
    return !!this._schema().enum
  }

  _handleChange(event) {
    this.setState({value: event.target.value})
    if (this._isSelect()) {
      this.props.node.onChange(event.target.value)
      data('/editing').set(false)
    }
  }

  _value() {
    return this._schema().type === 'number' ?
      parseFloat(this.state.value) :
      this.state.value
  }

  _schema() {
    return this.props.node.schema || {}
  }

  _handleKeyDown(event) {
    if (event.keyCode === 13 && !this._isSelect() && this._isValid()) {
      this.props.node.onChange(this._value())
    }
  }
}

class NodeView extends Component {
  render() {
    const props = this.props
    const data = props.data
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
    const data = props.data

    const path$ = data('/path').map(path => _.filter(path.split('/')))

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
              data={data}
              styles={props.styles}
              path={props.path}
              node={props.node}
              value={item}
            />
          }

          // View mode
          else {
            return <NodeView
              data={data}
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
