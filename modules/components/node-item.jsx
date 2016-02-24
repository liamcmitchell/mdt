import React, { Component, PropTypes } from 'react'
import { Combinator } from 'react-combinators/rx'
import Rx from 'rx'
import _ from 'underscore'

// Turn object into observable if it isn't already.
function $(v) {
  return Rx.Observable.isObservable(v) ? v : Rx.Observable.just(v)
}

class NodeItem extends Component {
  static propTypes = {
    path: PropTypes.array.isRequired,
    isFocusable: PropTypes.bool.isRequired,
    isFocused: PropTypes.bool.isRequired,
    isOnPath: PropTypes.bool.isRequired,
    styles: PropTypes.object.isRequired,
    onMouseDown: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func.isRequired,
    item: PropTypes.any.isRequired
  }

  constructor(props, context) {
    super(props, context)

    this.state = {
      // isFocused being true doesn't guarantee that the element is focused.
      focused: false
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state)
  }

  render() {
    const props = this.props
    const styles = props.styles
    const style = Object.assign({
      // It is possible that we have the cursor but don't have focus
      // and therefore can't catch keyboard events. This is possible if
      // another element is focused without updating our cursor or if the
      // browser focus is lost.
      // To show that we don't have control we fade the entire node.
      opacity: props.isFocused && !this.state.focused ? 0.7 : 1,
      // All node items respond to clicks.
      cursor: props.isFocusable ? "pointer" : null,
      // Give default styling
      backgroundColor: props.isOnPath ?
        styles.backgroundHighlightColor :
        null
    }, props.style)

    const item$ = $(props.item)
      .map(item => ({err: null, val: item}))
      .catch(err => $({err: err, val: null}))

    return <Combinator>
      <div
        ref="wrapper"
        style={style}
        tabIndex="-1"
        onFocus={this._handleFocus.bind(this)}
        onBlur={this._handleBlur.bind(this)}
        onMouseDown={props.isFocusable ? props.onMouseDown.bind(null, props.path) : null}
        onDoubleClick={props.isFocusable ? props.onDoubleClick.bind(null, props.path) : null}
        onKeyDown={props.isFocusable ? props.onKeyDown.bind(null, props.path) : null}
      >
        {item$.map(item => {
          const content = item.err ? item.err.toString() : item.val
          return typeof content === "string" ?
            <div
              style={{
                color: item.err ?
                  styles.red :
                  props.isFocusable ?
                    styles.primaryColor :
                    styles.secondaryColor,
                padding: styles.padding,
                whiteSpace: 'pre'
              }}
            >
              {content}
            </div> :
            content
        })}
      </div>
    </Combinator>
  }

  componentDidMount() {
    // Focus the node if we have the cursor on mount.
    if (this.props.isFocused) {
      this.refs.wrapper.focus()
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
      this.refs.wrapper.focus()
    }
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
          this.refs.wrapper.focus()
          // And if we still don't have it, update state.
          if (document.activeElement !== this.refs.wrapper) {
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

export default NodeItem
