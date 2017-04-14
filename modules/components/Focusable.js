import React, {Component, PropTypes} from 'react'

// Declarative focused state.
export default class Focusable extends Component {
  static propTypes = {
    el: PropTypes.string.isRequired,
    focused: PropTypes.bool
  }

  render() {
    const {el: El, focused, ...props} = this.props

    return <El
      ref={this._handleMount.bind(this)}
      onBlur={this._handleBlur.bind(this)}
      tabIndex='-1'
      {...props}
    />
  }

  componentDidUpdate() {
    this._focus()
  }

  _handleMount(el) {
    this.el = el
    this._focus()
  }

  _focus() {
    if (this.el && this.props.focused) {
      this.el.focus()
    }
  }

  _handleBlur(event) {
    // If we should be focused, try to recover before updating state.
    if (this.props.focused && document.activeElement !== this.el) {
      // Defer blur handling so we can see what has been focused.
      setTimeout(() => {
        // If we lost it to body, try to recover focus.
        if (this.props.focused && document.activeElement === document.body) {
          this._focus()
        }
      })
    }
  }
}
