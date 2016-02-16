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
    this.dataReady = {}
    this.observables = {}
    this.subscriptions = {}

    this.componentWillMount = wrapMethod(this, this.componentWillMount, function() {
      this._subscribeObservables(this.props)
    }.bind(this))

    this.componentWillUpdate = wrapMethod(this, this.componentWillUpdate,
      function(nextProps) {
        this._subscribeObservables(nextProps)
      }.bind(this)
    )

    this.componentWillUnmount = wrapMethod(this, this.componentWillUnmount, function() {
      this._unsubscribeObservables()
    }.bind(this))
  }

  observe(props) {
    return {}
  }

  _subscribeObservables(props) {
    // Prevent subscription loops.
    if (this._observableUpdate) return
    const observables = this.observe(props)
    // Used to prevent forceUpdate call when observables resolve immediately.
    let subscribing = true

    for (let key in observables) {
      let o = observables[key]

      // Skip subscription if it is the same observable.
      if (this.observables[key] === o) {
        break
      }

      this.observables[key] = o
      this.dataReady[key] = !!this.dataReady[key]

      let oldSub = this.subscriptions[key]
      this.subscriptions[key] = o.subscribe(value => {
        const oldValue = this.data[key]
        this.data[key] = value
        this.dataReady[key] = true
        if (!subscribing && value !== oldValue) {
          // Mark that we are updating because of observable to prevent subscription loops.
          this._observableUpdate = true
          this.forceUpdate()
          this._observableUpdate = false
        }
      }, err => {
        // Make troubleshooting easier by pointing showing key.
        console.error(new Error('Uncaught error in observable "' + key + '"'))
        console.error(err)
      })
      oldSub && oldSub.dispose()
    }

    subscribing = false
  }

  _unsubscribeObservables() {
    for (let key in this.subscriptions) {
      this.subscriptions[key].dispose()
    }
  }
}
