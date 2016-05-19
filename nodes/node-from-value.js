import _ from 'underscore'
import Rx from 'rx'

export default function nodesFromValue(opts) {
  const value = opts.value
  if (typeof value === 'function') {
    throw new Error("Functions can't be represented as nodes")
  }

  const nodes = []

  if (opts.onChange && possibleTypes(opts.schema).length > 1) {
    nodes.push(typeNode(opts))
  }

  return nodes.concat(TYPES[getType(value)].nodes(opts))
}

function possibleTypes(schema) {
  if (!schema || !schema.type) {
    return _.keys(TYPES)
  }
  else if (_.isString(schema.type)) {
    return [schema.type]
  }
  else {
    return schema.type
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

const TYPES = {
  null: {
    new: () => null,
    nodes: ({value, schema, path, onChange}) => {
      return [{
        key: 'val',
        item: value,
        focusable: false
      }]
    }
  },
  boolean: {
    new: () => false,
    nodes: ({value, schema, path, onChange}) => {
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
  },
  number: {
    new: () => 0,
    nodes: ({value, schema, path, onChange}) => {
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
  },
  string: {
    new: () => '',
    nodes: ({value, schema, path, onChange}) => {
      return [{
        key: 'val',
        item: value,
        schema: {
          type: 'string'
        },
        onChange: onChange
      }]
    }
  },
  array: {
    new: () => [],
    nodes: ({value, schema, path, onChange}) => {
      const createItemFn = createItem.bind(null, {value, schema, path, onChange})

      const nodes = _.map(value, (v, k) => ({
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
          createItemAllowed({value, schema, path, onChange}) ? {
            key: 'n',
            label: 'new item',
            fn: createItemFn
          } : null,
          deleteItemAllowed({value, schema, path, onChange}, k) ? {
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
          } : null
        ],
        nodes: nodesFromValue({
          value: v,
          schema: itemSchema({value, schema, path, onChange}, k),
          path: path.concat(k),
          onChange: newV =>
            onChange(value.map((oldV, oldK) => oldK === k ? newV : oldV))
        })
      }))

      // TODO: We are adding non-data to the UI, we should differentiate this.
      if (createItemAllowed({value, schema, path, onChange})) {
        nodes.push({
          key: 'new',
          item: '+',
          handlers: [{
            key: 'enter',
            label: 'new item',
            fn: createItemFn
          }]
        })
      }

      return nodes
    }
  },
  object: {
    new: () => ({}),
    nodes: ({value, schema, path, onChange}) => {
      const newPropertyFn = createProperty.bind(null, {value, schema, path, onChange})

      const nodes = _.map(value, (v, k) => {
        return {
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
            createPropertyAllowed({value, schema, path, onChange}) ? {
              key: 'n',
              label: 'new property',
              fn: newPropertyFn
            } : null,
            deletePropertyAllowed({value, schema, path, onChange}, k) ? {
              key: 'backspace',
              label: 'delete property',
              fn: () => {
                const index = _.indexOf(_.keys(value), k)
                const newVal = _.omit(value, k)
                const newKeys = _.keys(newVal)
                onChange(newVal)
                // .then(() => data('/cursor/path').set(path.concat(newKeys[index] || _.last(newKeys))))
              }
            } : null
          ],
          nodes: nodesFromValue({
            value: v,
            schema: propertySchema({value, schema, path, onChange}, k),
            path: path.concat(k),
            onChange: newV =>
              onChange(Object.assign(_.clone(value), _.object([k], [newV])))
          })
        }
      })

      if (createPropertyAllowed({value, schema, path, onChange})) {
        nodes.push({
          key: uniqueString('new', _.keys(value)),
          item: '+',
          handlers: [{
            key: 'enter',
            label: 'new property',
            fn: newPropertyFn
          }]
        })
      }

      return nodes
    }
  }
}

function itemSchema({value, schema, path, onChange}, k) {
  return !schema ?
    null :
    _.isObject(schema.items) && !_.isArray(schema.items) ?
      schema.items :
      // TODO: Handle tuple schema.
      null
}

function createItemAllowed({value, schema, path, onChange}) {
  if (!onChange) {
    return false
  }

  // Tuple
  if (schema && _.isArray(schema.items) && schema.additionalItems === false) {
    return false
  }

  return true
}

function deleteItemAllowed({value, schema, path, onChange}, k) {
  // TODO: Observe tuple, min & max restraints.
  return !!onChange
}

function createItem({value, schema, path, onChange}) {
  // Get type of new item from schema.
  const type = schema && schema.items && schema.items.type ?
    schema.items.type :
    null
  const types = _.isArray(type) ? type : [type]
  const newItem = TYPES[types[0]].new()
  return onChange(value.concat(newItem))
    // .then(() => data('/cursor/path').set(path.concat(value.length)))
}

function propertySchema({value, schema, path, onChange}, k) {
  // TODO: Pattern properties
  return !schema ?
    null :
    schema.properties && schema.properties.hasOwnProperty(k) ?
      schema.properties[k] :
      _.isObject(schema.additionalProperties) ?
        schema.additionalProperties :
        null
}

function createPropertyAllowed({value, schema, path, onChange}) {
  return onChange && (
    schema ?
      schema.additionalProperties !== false :
      true
  )
}

function deletePropertyAllowed({value, schema, path, onChange}, k) {
  // TODO: Observe min/max.
  return onChange && (
    schema ?
      (schema.required || []).indexOf(k) === -1 :
      true
  )
}

function createProperty({value, schema, path, onChange}) {
  // TODO: New property key should be edited immediately.
  // Create new property with key "new{i}".
  let i = 0
  while (value.hasOwnProperty('new' + (i ? i : ''))) {
    i++
  }
  const newK = 'new' + (i ? i : '')

  // Get type of new property from schema.
  const type = schema && schema.additionalProperties ?
    schema.additionalProperties.type :
    null
  const types = _.isArray(type) ? type : [type]
  const newV = TYPES[types[0]].new()

  return onChange(Object.assign(_.clone(value), _.object([newK], [newV])))
    // .then(() => {
    //   data('/cursor/path').set(path.concat(newK))
    //   return data('/cursor/editing').set(true)
    // })
}

function typeNode({value, schema, path, onChange}) {
  return {
    // Object property can be 'type'. Better solution is to namespace all keys
    // but I want to avoid this if possible.
    key: _.isObject(value) && !_.isArray(value) ?
      uniqueString('type', _.keys(value)) :
      'type',
    value: getType(value),
    item: '<' + getType(value) + '>',
    schema: {
      enum: _.keys(TYPES)
    },
    onChange: newType => onChange(TYPES[newType].new())
  }
}
