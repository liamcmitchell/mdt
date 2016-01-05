import React, { Component, PropTypes } from "react"
import styles from "lib/styles"

// Basic unit for text elements.
class TextItem extends Component {
  static propTypes = {
    text: PropTypes.string.isRequired,
    colors: PropTypes.object.isRequired
  }

  render() {
    return <div
      style={{
        padding: styles.defaultPadding,
        color: this.props.colors.secondary
      }}
    >
      {this.props.text}
    </div>
  }
}

export default TextItem
