import _ from 'underscore'
import Rx from 'rx'
import data from 'client-data'

export default function nodeFromValue(val, path, onChange) {
  if (typeof val === 'function') {
    throw new Error("Functions can't be represented as nodes")
  }
  return {
    nodes: [typeNode(val, path, onChange)].concat(
      _.isArray(val) ? arrayNodes(val, path, onChange) :
      _.isObject(val) ? objectNodes(val, path, onChange) :
      _.isNull(val) ? nullNodes(val, path, onChange) :
      _.isBoolean(val) ? booleanNodes(val, path, onChange) :
      _.isNumber(val) ? numberNodes(val, path, onChange) :
      _.isString(val) ? stringNodes(val, path, onChange) :
      []
    )
  }
}

function getType(val) {
  return (
    _.isArray(val) ? 'array' :
    _.isObject(val) ? 'object' :
    _.isNull(val) ? 'null' :
    _.isBoolean(val) ? 'boolean' :
    _.isNumber(val) ? 'number' :
    _.isString(val) ? 'string' :
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

function typeOptionNode(name, cb) {
  return {
    key: name,
    item: name,
    handlers: [
      {
        key: 'enter',
        label: 'select',
        fn: cb
      }
    ]
  }
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

function typeNode(val, path, onChange) {
  return {
    // Object property can be 'type'. Better solution is to namespace all keys
    // but I want to avoid this if possible.
    key: _.isObject(val) && !_.isArray(val) ?
      uniqueString('type', _.keys(val)) :
      'type',
    value: getType(val),
    item: '<' + getType(val) + '>',
    schema: {
      enum: _.keys(types())
    },
    onChange: newType => onChange(types()[newType]),
    // Probably nicer to have a dropdown or other in place selection.
    // For now, use child nodes.
    // nodes: [
    //   typeOptionNode('null', () => onChange(null)),
    //   typeOptionNode('boolean', () => onChange(false)),
    //   typeOptionNode('number', () => onChange(0)),
    //   typeOptionNode('string', () => onChange('')),
    //   typeOptionNode('array', () => onChange([])),
    //   typeOptionNode('object', () => onChange({}))
    // ],
    handlers: [
      getType(val) === 'object' ? newPropertyHandler(val, path, onChange) :
      getType(val) === 'array' ? newItemHandler(val, path, onChange) :
        null
    ]
  }
}

function newPropertyHandler(val, path, onChange) {
  return {
    key: 'n',
    label: 'new property',
    fn: () => {
      let i = 0
      while (val.hasOwnProperty('new' + (i ? i : ''))) {
        i++
      }
      const newK = 'new' + (i ? i : '')
      return onChange(Object.assign(_.clone(val), _.object([newK], [null])))
        .then(() => {
          data('/path').set('/' + path.concat(newK).join('/'))
          return data('/editing').set(true)
        })
    }
  }
}

function objectNodes(val, path, onChange) {
  const newProperty = newPropertyHandler(val, path, onChange)

  return _.map(val, (v, k) => {
    return Object.assign(
      nodeFromValue(v, path.concat(k), newV =>
        onChange(Object.assign(_.clone(val), _.object([k], [newV])))
      ),
      {
        key: k.toString(),
        item: k.toString(),
        // Allow editing property name.
        schema: {
          type: 'string',
          validator: testK => {
            if (testK !== k && val.hasOwnProperty(testK)) {
              return 'Duplicate key exists'
            }
            if (testK === '') {
              return 'No empty string properties you masochist'
            }
          }
        },
        onChange: newK => {
          // Try to preserve key order.
          return onChange(_.object(_.pairs(val).map(pair =>
            pair[0] === k ? [newK, pair[1]] : pair
          )))
          // Move to new path after making change.
          .then(() => data('/path').set('/' + path.concat(newK).join('/')))
        },
        handlers: [
          newProperty,
          {
            key: 'backspace',
            label: 'delete property',
            fn: () => {
              const index = _.indexOf(_.keys(val), k)
              const newVal = _.omit(val, k)
              const newKeys = _.keys(newVal)
              onChange(newVal)
              .then(() => data('/path').set('/' + path.concat(newKeys[index] || _.last(newKeys)).join('/')))
            }
          }
        ]
      }
    )
  })
}

function newItemHandler(val, path, onChange) {
  return {
    key: 'n',
    label: 'new item',
    fn: () => {
      return onChange(val.concat(null))
        .then(() => {
          return data('/path').set('/' + path.concat(val.length).join('/'))
        })
    }
  }
}

function arrayNodes(val, path, onChange) {
  const newItem = newItemHandler(val, path, onChange)

  return _.map(val, (v, k) => Object.assign(
    nodeFromValue(v, path.concat(k), newV =>
      onChange(val.map((oldV, oldK) => oldK === k ? newV : oldV))
    ),
    {
      key: k.toString(),
      item: k,
      // Allow editing index.
      schema: {
        type: 'number',
        minimum: 0,
        maximum: val.length - 1,
        multipleOf: 1
      },
      onChange: newK => {
        if (newK !== k) {
          const newVal = _.clone(val)
          newVal.splice(k, 1)
          newVal.splice(newK, 0, v)
          return onChange(newVal)
            .then(() => data('/path').set('/' + path.concat(newK).join('/')))
        }
      },
      handlers: [
        newItem,
        {
          key: 'backspace',
          label: 'delete item',
          fn: () => {
            const newVal = _.clone(val)
            newVal.splice(k, 1)
            return onChange(newVal)
              .then(() =>
                data('/path').set('/' + path.concat(newVal.length === k ? k - 1 : k).join('/'))
              )
          }
        }
      ]
    }
  ))
}

function nullNodes(val, path, onChange) {
  return [{
    key: 'val',
    item: val,
    focusable: false
  }]
}

function booleanNodes(val, path, onChange) {
  return [{
    key: 'val',
    item: val,
    handlers: [{
      key: 'enter',
      label: 'toggle',
      fn: () => onChange(!val)
    }]
  }]
}

function numberNodes(val, path, onChange) {
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
      fn: () => onChange(0)
    }]
  }]
}

function stringNodes(val, path, onChange) {
  return [{
    key: 'val',
    item: val,
    schema: {
      type: 'string'
    },
    onChange: onChange
  }]
}
