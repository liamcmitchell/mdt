import React, { Component } from 'react'
import Observe from 'components/observe'
import data from 'client-data'
import Rx from 'rx'
import _ from 'underscore'

function combine(observables) {
  return Rx.Observable.combineLatest(_.values(observables))
    .map(values => _.object(_.keys(observables), values))
}

function renderObservable(observable) {
  return <Observe observable={observable} />
}

/*
Node {
  key: string
  item: component $
  handlers: <{label/key/handler}> $
  children: <Node> $
}
*/

class Test extends Component {
  render() {
    return renderObservable(combine({
      dirs: data.observable('/dir'),
      path: data.observable('/path')
    }).map(({dirs, path}) =>
      <div>
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
        {renderObservable(
          data.observable('/file' + path).map(file =>
            <pre>
              {file}
            </pre>
        ))}
      </div>
    ))
  }
}

export default Test
