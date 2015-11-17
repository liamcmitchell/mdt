import { Component, PropTypes } from "react"

class Node extends Component {
  static propTypes = {
    path: PropTypes.object.isRequired,
    isFocused: PropTypes.bool.isRequired,
    isOnPath: PropTypes.bool.isRequired,
    styles: PropTypes.object,
    onMouseDown: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func.isRequired,
    item: PropTypes.node.isRequired
  }

  constructor(props, context) {
    super(props, context)

    this.state = {
      // isFocused being true doesn't guarantee that the element is focused.
      focused: false
    }
  }

  render() {
    const style = Object.assign({
      // It is possible that we have the cursor but don't have focus
      // and therefore can't catch keyboard events. This is possible if
      // another element is focused without updating our cursor or if the
      // browser focus is lost.
      // To show that we don't have control we fade the entire node.
      opacity: this.props.isFocused && !this.state.focused ? 0.7 : 1,
      // All node items respond to clicks.
      cursor: "pointer",
      // Give default styling
      backgroundColor: this.props.isOnPath ?
        this.props.styles.backgroundHighlightColor :
        null
    }, this.props.style)

    // Provide basic styling if item is text.
    const item = typeof this.props.item === "string" ?
      <div
        style={{
          color: this.props.styles.primaryColor,
          padding: this.props.styles.padding
        }}
      >
        {this.props.item}
      </div> :
      this.props.item

    return <div
      ref="wrapper"
      style={style}
      tabIndex="-1"
      onFocus={this._handleFocus.bind(this)}
      onBlur={this._handleBlur.bind(this)}
      onMouseDown={this.props.onMouseDown.bind(null, this.props.path)}
      onDoubleClick={this.props.onDoubleClick.bind(null, this.props.path)}
      onKeyDown={this.props.onKeyDown.bind(null, this.props.path)}
    >
      {item}
    </div>
  }

  componentDidMount() {
    // Focus the node if we have the cursor on mount.
    if (this.props.isFocused) {
      this.refs.wrapper.getDOMNode().focus()
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isFocused && !nextProps.isFocused) {
      // We are losing focus.
      this.setState({focused: false})
    }

    if (!this.props.isFocused && nextProps.isFocused) {
      // We are receiving focus. We will set focus on the node so we should be
      // OK to set the state before it happens.
      this.setState({focused: true})
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // Focus the actual DOM node.
    if (this.props.isFocused && !prevProps.isFocused) {
      this.refs.wrapper.getDOMNode().focus()
    }
  }

  shouldComponentUpdate(prevProps, prevState) {
    return (
      prevProps.isFocused !== this.props.isFocused ||
      prevProps.isOnPath !== this.props.isOnPath ||
      prevState.focused !== this.state.focused
    )
  }

  _handleFocus(event) {
    if (!this.state.focused) {
      // Should only happen when focus is returned to the browser.
      this.setState({focused: true})
    }
  }

  _handleBlur(event) {
    // If we should be focused, try to recover before updating state.
    if (this.props.isFocused && this.state.focused) {
      // Defer blur handling so we can see what has been focused.
      setTimeout(() => {
        // Try to recover focus if we lost it to body.
        if (document.activeElement === document.body) {
          this.refs.wrapper.getDOMNode().focus()
          // And if we still don't have it, update state.
          if (document.activeElement !== this.refs.wrapper.getDOMNode()) {
            this.setState({focused: false})
          }
        }
        // Another element has focus, so update state.
        else {
          this.setState({focused: false})
        }
      })
    }
  }
}

export default Node
