import _ from 'underscore'
import Rx from 'rx'
import data from 'client-data'

export default function nodeFromValue(val, onChange) {
  if (typeof val === 'function') {
    throw new Error("Functions can't be represented as nodes")
  }
  return {
    nodes:
      _.isObject(val) ? objectNodes(val, onChange) :
      _.isArray(val) ? arrayNodes(val, onChange) :
      _.isNull(val) ? nullNodes(val, onChange) :
      _.isBoolean(val) ? booleanNodes(val, onChange) :
      _.isNumber(val) ? numberNodes(val, onChange) :
      _.isString(val) ? stringNodes(val, onChange) :
      []
  }
}

function objectNodes(val, onChange) {
  return _.map(val, (v, k) => {
    const onPropValChange = (newPropVal) => {
      const newObject = _.clone(val)
      newObject[k] = newPropVal
      onChange(newObject)
    }
    return Object.assign(
      nodeFromValue(v, onPropValChange),
      {
        key: k.toString(),
        item: k.toString()
      }
    )
  })
}

function arrayNodes(val, onChange) {
  return _.map(val, (v, k) => Object.assign(nodeFromValue(v, onChange), {
    key: k.toString(),
    item: k.toString()
  }))
}

function nullNodes(val, onChange) {
  return [{
    key: 'val',
    item: 'null',
    focusable: false
  }]
}

function booleanNodes(val, onChange) {
  return [{
    key: 'val',
    item: val.toString(),
    handlers: [{
      key: 'enter',
      label: 'toggle',
      fn: () => onChange(!val)
    }]
  }]
}

function numberNodes(val, onChange) {
  return [{
    key: 'val',
    item: val,
    schema: {
      type: 'number'
    },
    onChange: onChange,
    handlers: [{
      key: 'a',
      label: 'set 0',
      fn: () => {
        onChange(0)
      }
    }]
  }]
}

function stringNodes(val, onChange) {
  return [{
    key: 'val',
    item: val,
    focusable: false
  }]
}
