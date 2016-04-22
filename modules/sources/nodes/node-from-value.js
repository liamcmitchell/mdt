import _ from 'underscore'
import Rx from 'rx'

export default function nodeFromValue(opts) {
  const value = opts.value
  if (typeof value === 'function') {
    throw new Error("Functions can't be represented as nodes")
  }
  return {
    nodes: [typeNode(opts)].concat(
      _.isArray(value) ? arrayNodes(opts) :
      _.isObject(value) ? objectNodes(opts) :
      _.isNull(value) ? nullNodes(opts) :
      _.isBoolean(value) ? booleanNodes(opts) :
      _.isNumber(value) ? numberNodes(opts) :
      _.isString(value) ? stringNodes(opts) :
      []
    )
  }
}

function getType(value) {
  return (
    _.isArray(value) ? 'array' :
    _.isObject(value) ? 'object' :
    _.isNull(value) ? 'null' :
    _.isBoolean(value) ? 'boolean' :
    _.isNumber(value) ? 'number' :
    _.isString(value) ? 'string' :
    'unknown'
  )
}

// Prepend underscore until it doesn't conflict.
function uniqueString(string, conflicting) {
  while (conflicting.indexOf(string) >= 0) {
    string = '_' + string
  }
  return string
}

function types() {
  return {
    null: null,
    boolean: false,
    number: 0,
    string: '',
    array: [],
    object: {}
  }
}

function typeNode({value, path, onChange}) {
  return {
    // Object property can be 'type'. Better solution is to namespace all keys
    // but I want to avoid this if possible.
    key: _.isObject(value) && !_.isArray(value) ?
      uniqueString('type', _.keys(value)) :
      'type',
    value: getType(value),
    item: '<' + getType(value) + '>',
    schema: {
      enum: _.keys(types())
    },
    onChange: newType => onChange(types()[newType]),
    handlers: [
      getType(value) === 'object' ? newPropertyHandler({value, path, onChange}) :
      getType(value) === 'array' ? newItemHandler({value, path, onChange}) :
        null
    ]
  }
}

function newPropertyHandler({value, path, onChange}) {
  return {
    key: 'n',
    label: 'new property',
    fn: () => {
      let i = 0
      while (value.hasOwnProperty('new' + (i ? i : ''))) {
        i++
      }
      const newK = 'new' + (i ? i : '')
      return onChange(Object.assign(_.clone(value), _.object([newK], [null])))
        // .then(() => {
        //   data('/cursor/path').set(path.concat(newK))
        //   return data('/cursor/editing').set(true)
        // })
    }
  }
}

function objectNodes({value, path, onChange}) {
  const newProperty = newPropertyHandler({value, path, onChange})

  return _.map(value, (v, k) => {
    return Object.assign(
      nodeFromValue({
        value: v,
        path: path.concat(k),
        onChange: newV =>
          onChange(Object.assign(_.clone(value), _.object([k], [newV])))
      }),
      {
        key: k.toString(),
        item: k.toString(),
        // Allow editing property name.
        schema: {
          type: 'string',
          validator: testK => {
            if (testK !== k && value.hasOwnProperty(testK)) {
              return 'Duplicate key exists'
            }
            if (testK === '') {
              return 'No empty string properties you masochist'
            }
          }
        },
        onChange: newK => {
          // Try to preserve key order.
          return onChange(_.object(_.pairs(value).map(pair =>
            pair[0] === k ? [newK, pair[1]] : pair
          )))
          // Move to new path after making change.
          // .then(() => data('/cursor/path').set(path.concat(newK)))
        },
        handlers: [
          newProperty,
          {
            key: 'backspace',
            label: 'delete property',
            fn: () => {
              const index = _.indexOf(_.keys(value), k)
              const newVal = _.omit(value, k)
              const newKeys = _.keys(newVal)
              onChange(newVal)
              // .then(() => data('/cursor/path').set(path.concat(newKeys[index] || _.last(newKeys))))
            }
          }
        ]
      }
    )
  })
}

function newItemHandler({value, path, onChange}) {
  return {
    key: 'n',
    label: 'new item',
    fn: () => {
      return onChange(value.concat(null))
        // .then(() => data('/cursor/path').set(path.concat(value.length)))
    }
  }
}

function arrayNodes({value, path, onChange}) {
  const newItem = newItemHandler({value, path, onChange})

  return _.map(value, (v, k) => Object.assign(
    nodeFromValue({
      value: v,
      path: path.concat(k),
      onChange: newV =>
        onChange(value.map((oldV, oldK) => oldK === k ? newV : oldV))
    }),
    {
      key: k.toString(),
      item: k,
      // Allow editing index.
      schema: {
        type: 'number',
        minimum: 0,
        maximum: value.length - 1,
        multipleOf: 1
      },
      onChange: newK => {
        if (newK !== k) {
          const newVal = _.clone(value)
          newVal.splice(k, 1)
          newVal.splice(newK, 0, v)
          return onChange(newVal)
            // .then(() => data('/cursor/path').set(path.concat(newK)))
        }
      },
      handlers: [
        newItem,
        {
          key: 'backspace',
          label: 'delete item',
          fn: () => {
            const newVal = _.clone(value)
            newVal.splice(k, 1)
            return onChange(newVal)
              // .then(() =>
              //   data('/cursor/path').set(path.concat(newVal.length === k ? k - 1 : k))
              // )
          }
        }
      ]
    }
  ))
}

function nullNodes({value, path, onChange}) {
  return [{
    key: 'val',
    item: value,
    focusable: false
  }]
}

function booleanNodes({value, path, onChange}) {
  return [{
    key: 'val',
    item: value,
    handlers: [{
      key: 'enter',
      label: 'toggle',
      fn: () => onChange(!value)
    }]
  }]
}

function numberNodes({value, path, onChange}) {
  return [{
    key: 'val',
    item: value,
    schema: {
      type: 'number'
    },
    onChange: onChange,
    handlers: [{
      key: 'a',
      label: 'set 0',
      fn: () => onChange(0)
    }]
  }]
}

function stringNodes({value, path, onChange}) {
  return [{
    key: 'val',
    item: value,
    schema: {
      type: 'string'
    },
    onChange: onChange
  }]
}
