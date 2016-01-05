import React, { Component } from 'react'
import serverSource from 'sources/server'

class Live extends Component {
  constructor(props, context) {
    super(props, context)

    this.state = {
      val: ''
    }
  }

  render() {
    return <span>{this.state.val}</span>
  }

  componentWillMount() {
    this._setSubscription()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.url !== this.props.url) {
      this.subscription.dispose()
      this._setSubscription()
    }
  }

  _setSubscription() {
    this.subscription = serverSource(this.props.url).subscribe(data => {
      this.setState({val: data})
    })
  }

  componentWillUnmount() {
    this.subscription.dispose()
  }
}

export default {
  key: "mdt",
  item: () => "mdt",
  children: () => [
    // mdt.require("/config").mdtVersion
    "1.0.0",
    "/local/mdt.json",
    {
      key: 'yo',
      item: <Live url='/local/mdt.json' />
    }
  ]
}
