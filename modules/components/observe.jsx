import React, { Component } from 'react'

// Placeholder until first render.
const noVTree = {}

export default class Observe extends Component {
  constructor(props, context) {
    super(props, context)

    this.state = {
      vTree: noVTree
    }
  }

  componentWillMount() {
    this.subscription = this.props.observable.subscribe(vTree => this.setState({ vTree }))
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.observable !== this.props.observable) {
      let oldSub = this.subscription
      this.subscription = nextProps.observable.subscribe(vTree => this.setState({ vTree }))
      oldSub.dispose()
    }
  }

  componentWillUnmount() {
    this.subscription.dispose()
  }

  render() {
    if (this.state.vTree === noVTree)
      // Should the loading render be configurable?
      return null
    else
      // Why clone? Not sure...
      return React.cloneElement(this.state.vTree)
  }
}
