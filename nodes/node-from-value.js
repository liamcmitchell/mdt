import _ from 'underscore'
import Rx from 'rx'

const flatFilter = _.compose(_.filter, _.flatten)

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

export default function nodesFromValue({value, schema, path, onChange}) {
  if (typeof value === 'function') {
    throw new Error("Functions can't be represented as nodes")
  }

  const nodesFn = TYPES[getType(value)].nodes

  return flatFilter([
    typeNode({value, schema, path, onChange}),
    nodesFn({value, schema, path, onChange})
  ])
}

function newValueFromSchema(schema) {
  return TYPES[schemaTypes(schema)[0]].new()
}

function schemaTypes(schema) {
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

function typeNode({value, schema, path, onChange}) {
  if (!onChange || schemaTypes(schema).length === 1) {
    return null
  }

  return {
    // Object property can be 'type'. Better solution is to namespace all keys
    // but I want to avoid this if possible.
    key: _.isObject(value) && !_.isArray(value) ?
      uniqueString('type', _.keys(value)) :
      'type',
    value: getType(value),
    item: '<' + getType(value) + '>',
    schema: {
      enum: schemaTypes(schema)
    },
    onChange: newType => onChange(TYPES[newType].new())
  }
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
      return [
        _.map(value, itemNode.bind(null, {value, schema, path, onChange})),
        createItemNode({value, schema, path, onChange})
      ]
    }
  },
  object: {
    new: () => ({}),
    nodes: ({value, schema, path, onChange}) => {
      return [
        _.map(value, propertyNode.bind(null, {value, schema, path, onChange})),
        createPropertyNode({value, schema, path, onChange})
      ]
    }
  }
}

// Array item.
function itemNode({value, schema, path, onChange}, v, k) {
  return {
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
        fn: createItem.bind(null, {value, schema, path, onChange})
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
  }
}

function createItemNode({value, schema, path, onChange}) {
  if (!createItemAllowed({value, schema, path, onChange})) {
    return null
  }

  return {
    key: 'new',
    item: '+',
    handlers: [{
      key: 'enter',
      label: 'new item',
      fn: createItem.bind(null, {value, schema, path, onChange})
    }]
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
  const newItem = newValueFromSchema(itemSchema({value, schema, path, onChange}, value.length))

  return onChange(value.concat([newItem]))
    // .then(() => data('/cursor/path').set(path.concat(value.length)))
}

function propertyNode({value, schema, path, onChange}, v, k) {
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
      createPropertyHandler({value, schema, path, onChange}),
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
}

function createPropertyNode({value, schema, path, onChange}) {
  if (!createPropertyAllowed({value, schema, path, onChange})) {
    return null
  }

  return {
    key: uniqueString('new', _.keys(value)),
    item: '+',
    value: '',
    schema: {
      type: 'string'
      // TODO: Validate keys.
    },
    onChange: newK => {
      // Get value for new property from schema.
      const newV = newValueFromSchema(propertySchema({value, schema, path, onChange}, newK))

      return onChange(Object.assign(_.clone(value), _.object([newK], [newV])))
        // .then(() => {
        //   data('/cursor/path').set(path.concat(newK))
        //   return data('/cursor/editing').set(true)
        // })
    }
  }
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
      // Allow delete if key is not required.
      (schema.required || []).indexOf(k) === -1 :
      true
  )
}

function createPropertyHandler({value, schema, path, onChange}) {
  if (!createPropertyAllowed({value, schema, path, onChange})) {
    return null
  }

  return {
    key: 'n',
    label: 'new property',
    fn: () => {
      // TODO: Move cursor to new property node.
      console.log('TODO')
      // return data('/cursor').set({
      //   path: path.concat(uniqueString('new', _.keys(value))),
      //   editing: true
      // })
    }
  }
}
