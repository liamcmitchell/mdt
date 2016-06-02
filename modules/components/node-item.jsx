import React, { Component, PropTypes } from 'react'
import { Combinator } from 'react-combinators/rx'
import Focusable from 'components/focusable'
import $ from 'lib/rx'
import _ from 'underscore'
import { isFocusable } from 'lib/node-helpers'
import validate from 'lib/validate'
import {withIO} from 'react-io'

class NodeEdit extends Component {
  constructor(props, context) {
    super(props, context)

    this.state = {
      value: props.node.hasOwnProperty('value') ?
        props.node.value :
        props.value
    }
  }

  render() {
    const {node, styles} = this.props
    const schema = node.schema || {}

    return this._isSelect() ?
      <div
        style={{
          padding: styles.padding,
          backgroundColor: styles.backgroundHighlightColor
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
          padding: styles.padding,
          color: this._isValid() ?
            styles.primaryColor :
            styles.red,
          backgroundColor: styles.backgroundHighlightColor
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
      this.props.io('/cursor/editing').set(false)
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
    const {io, item, isFocused, path, styles, isOnPath, node} = this.props
    const focusable = isFocusable(node)

    return <Focusable
      el='div'
      focused={isFocused}
      href={'/' + path.join('/')}
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
        backgroundColor: isOnPath ?
          styles.backgroundHighlightColor :
          null
      }}
      onClick={(e) => {
        if (focusable) {
          io('/cursor/path').set(path)
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

class NodeItem extends Component {
  static propTypes = {
    path: PropTypes.array.isRequired,
    styles: PropTypes.object.isRequired,
    node: PropTypes.object.isRequired
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state)
  }

  render() {
    const {io, path, node, styles} = this.props

    const cursorPath$ = io('/cursor/path').observable()

    const isFocused$ = cursorPath$
      .map(path => _.isEqual(path, path))
      .distinctUntilChanged()

    const isOnPath$ = cursorPath$
      .map(cursorPath => _.isEqual(cursorPath.slice(0, path.length), path))
      .distinctUntilChanged()

    const item$ = $(node.item)

    return <Combinator>
      <div
        style={{
          overflow: 'hidden'
        }}
      >
        {$.combineLatest([
          isOnPath$,
          isFocused$,
          io('/cursor/editing'),
          item$
        ], (isOnPath, isFocused, editing, item) => {

          // Edit mode
          if (isFocused && editing) {
            return <NodeEdit
              io={io}
              styles={styles}
              path={path}
              node={node}
              value={item}
            />
          }

          // View mode
          else {
            return <NodeView
              io={io}
              styles={styles}
              path={path}
              node={node}
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

export default withIO(NodeItem)
