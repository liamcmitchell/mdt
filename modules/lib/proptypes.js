import React from "react"

export default {
  JSON: React.PropTypes.oneOfType([
    React.PropTypes.bool,
    React.PropTypes.number,
    React.PropTypes.string,
    React.PropTypes.array,
    React.PropTypes.object
  ])
}
