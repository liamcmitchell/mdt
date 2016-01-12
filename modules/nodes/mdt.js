import React, { Component } from 'react'
import data from 'client-data'
import Observe from 'components/observe'

function renderObservable(observable) {
  return <Observe observable={observable} />
}

export default {
  key: "mdt",
  item: () => "mdt",
  children: () => [
    "1.0.0",
    "/file/mdt.json",
    {
      key: 'file',
      item: renderObservable(data.observable('/file/date').map(date =>
        <span>{date}</span>
      ))
    },
    {
      key: 'dir',
      item: renderObservable(data.observable('/dir').map(dirs =>
        <ul>
          {dirs.map(dir =>
            <li
              key={dir}
            >
              {dir}
            </li>
          )}
        </ul>
      ))
      // children: data.observable('/dir').map(dir =>
      //   ['test']
      // )
    }
  ]
}
