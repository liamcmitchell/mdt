import { Component, PropTypes } from "react"
import Cursor from "lib/cursor"
import keycode from "keycode"
import childrenToArray from "lib/childrenToArray"

class NodeItem extends Component {
  static isNodeItem = true

  static propTypes = {
    cursor: PropTypes.instanceOf(Cursor),
    handlers: PropTypes.object,
    styles: PropTypes.object
  }

  constructor(props, context) {
    super(props, context)

    this.state = {
      // Having the cursor doesn't guarantee that the element is focused.
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
      opacity: this.props.cursor.isHere && !this.state.focused ? 0.7 : 1,
      // All node items respond to clicks.
      cursor: "pointer",
      // Give default styling
      backgroundColor: this.props.cursor.isHere ?
        this.props.styles.backgroundHighlightColor :
        null
    }, this.props.style)

    const children = childrenToArray(this.props.children)

    // Provide basic styling if only child is text.
    const content = children.length === 1 && typeof children[0] === "string" ?
      <div
        style={{
          color: this.props.styles.primaryColor,
          padding: this.props.styles.padding
        }}
      >
        {children[0]}
      </div> :
      this.props.children

    return <div
      ref="wrapper"
      style={style}
      tabIndex="-1"
      onFocus={this._handleFocus.bind(this)}
      onBlur={this._handleBlur.bind(this)}
      onClick={this._handleClick.bind(this)}
      onDoubleClick={this._handleDoubleClick.bind(this)}
      onKeyDown={this._handleKeyDown.bind(this)}
    >
      {content}
    </div>
  }

  _handleFocus(event) {
    if (!this.state.focused) {
      this.setState({focused: true})
    }
  }

  _handleBlur(event) {
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

  _handleClick(event) {
    // Bring cursor here.
    if (!this.props.cursor.isHere) {
      this.props.cursor.setPath()
    }
  }

  _handleDoubleClick(event) {
    this._tryHandler('enter', event)
  }

  _handleKeyDown(event) {
    this._tryHandler(keycode(event), event)
  }

  _tryHandler(name, event) {
    const handlers = this.props.handlers
    if (handlers[name]) {
      handlers[name](event)
    }
  }

  componentDidMount() {
    // Focus the node if we have the cursor on mount.
    if (this.props.cursor.isHere) {
      this.refs.wrapper.getDOMNode().focus()
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // Focus the node if we receive the cursor.
    if (
      this.props.cursor.isHere &&
      !prevProps.cursor.isHere
    ) {
      this.refs.wrapper.getDOMNode().focus()
    }
  }
}

export default NodeItem