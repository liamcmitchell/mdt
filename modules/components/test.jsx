import React, { Component } from 'react'
import ObservableComponent from 'components/observable'
import data from 'client-data'

class Test extends ObservableComponent {

  observe() {
    return {
      dirs: data.observable('/dir').startWith([]),
      path: data.observable('/path')
    }
  }

  render() {
    const { dirs, path } = this.data

    return <div>
      <ul>
        {dirs.map(dir =>
          <li
            key={dir}
            onClick={() => { data.set('/path', '/' + dir) }}
          >
            {dir}
          </li>
        )}
      </ul>
    </div>
  }
}

export default Test
