import React, {Component} from 'react'
import validate from 'lib/validate'
import {withIO} from 'react-io'
import compose from 'recompose/compose'

export default compose(
  withIO({
    styles: '/styles',
    location: '/location',
  })
)(
  class ItemEdit extends Component {
    constructor({value}) {
      super()
      this.state = {value}
    }

    componentDidMount() {
      if (this.isSelect()) {
        this.input.focus()
      } else {
        this.input.select()
      }
    }

    isValid() {
      const result = validate(this.value(), this.schema())
      if (result.errors.length) {
        // TODO: Show user these. If I want to show them in the status bar...
        // all this logic needs to be pulled out of this component.
        // console.log('validation errors', result.errors)
      }
      return result.valid
    }

    isSelect() {
      return !!this.schema().enum
    }

    value() {
      return this.schema().type === 'number'
        ? parseFloat(this.state.value)
        : this.state.value
    }

    schema() {
      return this.props.schema || {}
    }

    escape() {
      const {io, location: {pathname}} = this.props
      io('/location', 'REPLACE', {pathname})
    }

    handleChange = (event) => {
      const {onChange} = this.props

      this.setState({value: event.target.value})

      if (this.isSelect()) {
        onChange(event.target.value)
        this.escape()
      }
    }

    handleKeyDown = (event) => {
      if (event.keyCode === 13 && !this.isSelect() && this.isValid()) {
        this.props.onChange(this.value())
        this.escape()
      }
    }

    handleRef = (input) => {
      this.input = input
    }

    render() {
      const {styles, schema} = this.props
      const {value} = this.state

      return this.isSelect() ? (
        <div
          style={{
            padding: styles.padding,
          }}
        >
          <select
            style={{
              width: '100%',
            }}
            value={value}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}
            ref={this.handleRef}
          >
            {schema.enum.map((val, k) => (
              <option key={k} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input
          type={schema.type === 'number' ? 'number' : 'string'}
          value={value}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          ref={this.handleRef}
          style={{
            padding: styles.padding,
            color: this.isValid() ? styles.primaryColor : styles.red,
            backgroundColor: styles.backgroundHighlightColor,
          }}
        />
      )
    }
  }
)
