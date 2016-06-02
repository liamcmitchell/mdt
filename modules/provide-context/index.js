import React, {PropTypes} from 'react'
import hoistStatics from 'hoist-non-react-statics'

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

export function contextProviderComponent(types, name = 'ContextProvider') {
  return React.createClass({
      displayName: name,
      propTypes: Object.assign({
        children: PropTypes.element
      }, types),
      childContextTypes: types,
      getChildContext() {
        const context = {}
        for (let key in types) {
          context[key] = this.props[key]
        }
        return context
      },
      render() {
        return this.props.children
      }
    })
}


export function withContextFunction(types, name = 'withContext') {
  return function(WrappedComponent) {
    const WithContext = React.createClass({
      contextTypes: types,
      render() {
        const context = {}
        for (let key in types) {
          // TODO: Warn if props are overwriting context.
          context[key] = this.context[key]
        }
        return React.createElement(WrappedComponent, Object.assign(context, this.props))
      }
    })

    WithContext.displayName = `${name}(${getDisplayName(WrappedComponent)})`
    WithContext.WrappedComponent = WrappedComponent

    return hoistStatics(WithContext, WrappedComponent)
  }
}