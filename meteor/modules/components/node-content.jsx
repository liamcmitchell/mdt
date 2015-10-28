import { Component, PropTypes } from "react"
import childrenToArray from "lib/childrenToArray"

class NodeContent extends Component {
  static isNodeContent = true

  static propTypes = {
    styles: PropTypes.object,
    childContent: PropTypes.node
  }

  render() {
    // Give plain strings standard padding.
    const children = childrenToArray(this.props.children).map((child, i) =>
      typeof child === "string" ?
        <div
          key={i}
          style={{
            padding: this.props.styles.padding,
            color: this.props.styles.secondaryColor
          }}
        >
          {child}
        </div> :
        child
    )

    return <div
      style={{
        display: "flex",
        flexDirection: "row",
        flex: 1,
        backgroundColor: this.props.styles.backgroundColor
      }}
    >
      <div style={{
        display: "flex",
        flexDirection: "column"
      }}>
        {children}
      </div>
      {this.props.childContent}
    </div>
  }
}

export default NodeContent
