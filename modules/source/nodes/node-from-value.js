import clone from 'lodash/clone'
import filter from 'lodash/filter'
import flattenDeep from 'lodash/flattenDeep'
import isArray from 'lodash/isArray'
import isObject from 'lodash/isObject'
import isNull from 'lodash/isNull'
import isBoolean from 'lodash/isBoolean'
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'
import keys from 'lodash/keys'
import map from 'lodash/map'
import omit from 'lodash/omit'
import toPairs from 'lodash/toPairs'
import fromPairs from 'lodash/fromPairs'
import indexOf from 'lodash/indexOf'

function getType(value) {
  return (
    isArray(value) ? 'array' :
    isObject(value) ? 'object' :
    isNull(value) ? 'null' :
    isBoolean(value) ? 'boolean' :
    isNumber(value) ? 'number' :
    isString(value) ? 'string' :
    'unknown'
  )
}

export default function nodesFromValue(props) {
  const {value} = props

  if (typeof value === 'function') {
    throw new Error("Functions can't be represented as nodes")
  }

  const nodesFn = TYPES[getType(value)].nodes

  return filter(flattenDeep([
    typeNode(props),
    nodesFn(props)
  ]))
}

function newValueFromSchema(schema) {
  return TYPES[schemaTypes(schema)[0]].new()
}

function schemaTypes(schema) {
  if (!schema || !schema.type) {
    return keys(TYPES)
  }
  else if (isString(schema.type)) {
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
    key: isObject(value) && !isArray(value) ?
      uniqueString('type', keys(value)) :
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
        map(value, itemNode.bind(null, {value, schema, path, onChange})),
        createItemNode({value, schema, path, onChange})
      ]
    }
  },
  object: {
    new: () => ({}),
    nodes: ({value, schema, path, onChange}) => {
      return [
        map(value, propertyNode.bind(null, {value, schema, path, onChange})),
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
        const newVal = clone(value)
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
          const newVal = clone(value)
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
    isObject(schema.items) && !isArray(schema.items) ?
      schema.items :
      // TODO: Handle tuple schema.
      null
}

function createItemAllowed({value, schema, path, onChange}) {
  if (!onChange) {
    return false
  }

  // Tuple
  if (schema && isArray(schema.items) && schema.additionalItems === false) {
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
      return onChange(fromPairs(toPairs(value).map(pair =>
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
          const index = indexOf(keys(value), k)
          const newVal = omit(value, k)
          const newKeys = keys(newVal)
          onChange(newVal)
          // .then(() => data('/cursor/path').set(path.concat(newKeys[index] || last(newKeys))))
        }
      } : null
    ],
    nodes: nodesFromValue({
      value: v,
      schema: propertySchema({value, schema, path, onChange}, k),
      path: path.concat(k),
      onChange: newV =>
        onChange({
          ...value,
          [k]: newV
        })
    })
  }
}

function createPropertyNode({value, schema, path, onChange}) {
  if (!createPropertyAllowed({value, schema, path, onChange})) {
    return null
  }

  return {
    key: uniqueString('new', keys(value)),
    item: '+',
    value: '',
    schema: {
      type: 'string'
      // TODO: Validate keys.
    },
    onChange: newK => {
      // Get value for new property from schema.
      const newV = newValueFromSchema(propertySchema({value, schema, path, onChange}, newK))

      return onChange({
        ...value,
        [newK]: newV
      })
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
      isObject(schema.additionalProperties) ?
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
      //   path: path.concat(uniqueString('new', keys(value))),
      //   editing: true
      // })
    }
  }
}
