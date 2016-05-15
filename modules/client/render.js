import React from 'react'
import ReactDOM from 'react-dom'
import App from 'components/app'
import NodeUI from 'components/node-ui'
import colors from 'lib/colors'

export default function render(element, source) {
  ReactDOM.render(
    <App>
      <NodeUI
        data={source}
        styles={Object.assign({
          padding: '10px 20px'
        }, colors.solarizedDark)}
      />
    </App>,
    element
  )
}