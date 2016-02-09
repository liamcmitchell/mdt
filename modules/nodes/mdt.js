import React, { Component } from 'react'
import data from 'client-data'
import fsNodes from 'nodes/fs'

export default {
  key: "mdt",
  item: () => "mdt",
  nodes: () => [
    {
      key: 'dir',
      item: 'local',
      nodes: fsNodes('')
    }
  ]
}
