import React, { Component, PropTypes } from 'react'

export default class Observable extends Component {
  static propTypes = {
    observable: PropTypes.shape({
      subscribe: PropTypes.func.isRequired
    }).isRequired,
    loading: PropTypes.node
  }

  constructor(props, context) {
    super(props, context)

    this.state = {
      vTree: props.loading
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
    return this.state.vTree
    // Does the vTree need to be cloned?
    // return React.cloneElement(this.state.vTree)
  }
}
