import React, { Component } from 'react'

function wrapMethod(self, originalFn, newFn) {
  return originalFn ?
    function() {
      originalFn.apply(self, arguments)
      newFn.apply(self, arguments)
    } :
    newFn
}

export default class ObservableComponent extends Component {
  constructor(props, context) {
    super(props, context)

    this.data = {}
    this.observables = {}
    this.subscriptions = {}

    this.componentWillMount = wrapMethod(this, this.componentWillMount, function() {
      this._subscribeObservables(this.props, this.state)
    }.bind(this))

    this.componentWillUpdate = wrapMethod(this, this.componentWillUpdate,
      function(nextProps, nextState) {
        this._subscribeObservables(nextProps, nextState)
      }.bind(this)
    )

    this.componentWillUnmount = wrapMethod(this, this.componentWillUnmount, function() {
      this._unsubscribeObservables()
    }.bind(this))
  }

  observe(props, state) {
    return {}
  }

  _subscribeObservables(props, state) {
    const observables = this.observe(props, state)
    // Used to prevent forceUpdate call when observables resolve immediately.
    let subscribing = true

    for (let key in observables) {
      let o = observables[key]

      // Only continue if observable is new.
      if (this.observables[key] !== o) {

        this.observables[key] = o

        let oldSub = this.subscriptions[key]
        this.subscriptions[key] = o.subscribe(value => {
          this.data[key] = value

          !subscribing && this.forceUpdate()
        })
        oldSub && oldSub.dispose()
      }
    }

    subscribing = false
  }

  _unsubscribeObservables() {
    for (let key in this.subscriptions) {
      this.subscriptions[key].dispose()
    }
  }
}
