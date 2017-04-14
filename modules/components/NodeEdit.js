import React, {Component} from 'react'
import validate from 'lib/validate'

export default class NodeEdit extends Component {
  constructor(props) {
    super()

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

  componentDidMount() {
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
      // this.props.io('/location', 'REPLACE', {
      //   search: {editing: false}
      // })
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
