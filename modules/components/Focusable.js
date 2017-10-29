import React, {Component} from 'react'
import PropTypes from 'prop-types'

// Declarative focused state.
export default class Focusable extends Component {
  static propTypes = {
    el: PropTypes.string.isRequired,
    focused: PropTypes.bool
  }

  componentDidMount() {
    this.focus()
  }

  componentDidUpdate() {
    this.focus()
  }

  handleRef = el => {
    this.el = el
  }

  hasFocus() {
    return this.el && this.el.contains(document.activeElement)
  }

  focus() {
    if (
      this.el &&
      this.props.focused &&
      !this.hasFocus()
    ) {
      this.el.focus()
    }
  }

  handleBlur = () => {
    // If we should be focused, try to recover before updating state.
    if (this.props.focused && !this.hasFocus()) {
      // Defer blur handling so we can see what has been focused.
      setTimeout(() => {
        // If we lost it to body, try to recover focus.
        if (this.props.focused && document.activeElement === document.body) {
          this.focus()
        }
      })
    }
  }

  render() {
    const {el: El, focused, ...props} = this.props

    return <El
      ref={this.handleRef}
      onBlur={this.handleBlur}
      tabIndex='-1'
      {...props}
    />
  }
}
