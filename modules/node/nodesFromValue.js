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
import last from 'lodash/last'
import React from 'react'
import ItemEdit from 'node/ItemEdit'

function getType(value) {
  return isArray(value)
    ? 'array'
    : isObject(value)
      ? 'object'
      : isNull(value)
        ? 'null'
        : isBoolean(value)
          ? 'boolean'
          : isNumber(value) ? 'number' : isString(value) ? 'string' : 'unknown'
}

// Generate nodes to view (and edit) a given value.
export default function nodesFromValue(props) {
  const {value} = props

  if (typeof value === 'function') {
    throw new Error("Functions can't be represented as nodes")
  }

  const childrenFn = TYPES[getType(value)].children

  return filter(flattenDeep([typeNode(props), childrenFn(props)]))
}

function newValueFromSchema(schema) {
  return TYPES[schemaTypes(schema)[0]].new()
}

function schemaTypes(schema) {
  if (!schema || !schema.type) {
    return keys(TYPES)
  } else if (isString(schema.type)) {
    return [schema.type]
  } else {
    return schema.type
  }
}

function typeNode({schema, onChange, value}) {
  if (!onChange || schemaTypes(schema).length === 1) {
    return null
  }

  return {
    key: 'type',
    handlers: ({io, path, params: {mode}}) => [
      mode !== 'edit' && {
        key: 'enter',
        label: 'edit',
        fn: () =>
          io('/location', 'REPLACE', {
            pathname: `/${path}`,
            search: {mode: 'edit'},
          }),
      },
    ],
    item: ({params: {mode}}) =>
      mode !== 'edit' ? (
        '<' + getType(value) + '>'
      ) : (
        <ItemEdit
          value={getType(value)}
          schema={{
            enum: schemaTypes(schema),
          }}
          onChange={(newType) => onChange(TYPES[newType].new())}
        />
      ),
  }
}

// Must namespace and encode keys.
const toSafeKey = (key) => `.${key}`

const pathSibling = (path, sibling) => {
  return path
    .split('/')
    .slice(0, -1)
    .concat([sibling])
    .join('/')
}

const TYPES = {
  null: {
    new: () => null,
    children: ({value}) => {
      return [
        {
          key: 'val',
          item: value,
          focusable: false,
        },
      ]
    },
  },
  boolean: {
    new: () => false,
    children: ({value, onChange}) => {
      return [
        {
          key: 'val',
          item: value,
          handlers: [
            {
              key: 'enter',
              label: 'toggle',
              fn: () => onChange(!value),
            },
          ],
        },
      ]
    },
  },
  number: {
    new: () => 0,
    children: ({value, onChange}) => {
      return [
        {
          key: 'val',
          item: ({params: {mode}}) =>
            mode !== 'edit' ? (
              value
            ) : (
              <ItemEdit
                value={value}
                schema={{
                  type: 'number',
                }}
                onChange={onChange}
              />
            ),
          handlers: ({io, path, params: {mode}}) => [
            mode !== 'edit' && {
              key: 'enter',
              label: 'edit',
              fn: () =>
                io('/location', 'REPLACE', {
                  pathname: `/${path}`,
                  search: {mode: 'edit'},
                }),
            },
          ],
        },
      ]
    },
  },
  string: {
    new: () => '',
    children: ({value, onChange}) => {
      return [
        {
          key: 'val',
          item: ({params: {mode}}) =>
            mode !== 'edit' ? (
              value
            ) : (
              <ItemEdit
                value={value}
                schema={{
                  type: 'string',
                }}
                onChange={onChange}
              />
            ),
          handlers: ({io, path, params: {mode}}) => [
            mode !== 'edit' && {
              key: 'enter',
              label: 'edit',
              fn: () =>
                io('/location', 'REPLACE', {
                  pathname: `/${path}`,
                  search: {mode: 'edit'},
                }),
            },
          ],
        },
      ]
    },
  },
  array: {
    new: () => [],
    children: (props) => {
      const {value, onChange} = props

      return [
        // Array items.
        map(value, (v, k) => {
          return {
            key: toSafeKey(k),
            item: ({params: {mode}}) =>
              mode !== 'edit' ? (
                k
              ) : (
                // Allow editing index.
                <ItemEdit
                  value={k}
                  schema={{
                    type: 'number',
                    minimum: 0,
                    maximum: value.length - 1,
                    multipleOf: 1,
                  }}
                  onChange={(newK) => {
                    if (newK !== k) {
                      const newVal = clone(value)
                      newVal.splice(k, 1)
                      newVal.splice(newK, 0, v)
                      return onChange(newVal)
                    }
                  }}
                />
              ),
            handlers: ({io, path, params: {mode}}) => {
              if (!mode) {
                return [
                  mode !== 'edit' && {
                    key: 'enter',
                    label: 'edit',
                    fn: () =>
                      io('/location', 'REPLACE', {
                        pathname: `/${path}`,
                        search: {mode: 'edit'},
                      }),
                  },
                  createItemAllowed(props) && {
                    key: 'n',
                    label: 'new item',
                    fn: () => {
                      // Get type of new item from schema.
                      const newItem = newValueFromSchema(
                        itemSchema(props, value.length)
                      )

                      return onChange(value.concat([newItem])).then(() =>
                        io('/location', 'REPLACE', {
                          pathname: `/${path}/${toSafeKey(value.length)}`,
                        })
                      )
                    },
                  },
                  Boolean(onChange) && {
                    key: 'backspace',
                    label: 'delete item',
                    fn: () => {
                      const newVal = clone(value)
                      newVal.splice(k, 1)
                      return onChange(newVal).then(() =>
                        io('/location', 'REPLACE', {
                          pathname: `/${pathSibling(
                            path,
                            toSafeKey(Math.min(k, newVal.length - 1))
                          )}`,
                        })
                      )
                    },
                  },
                ]
              }
            },
            children: nodesFromValue({
              value: v,
              schema: itemSchema(props, k),
              onChange: (newV) =>
                onChange(value.map((oldV, oldK) => (oldK === k ? newV : oldV))),
            }),
          }
        }),
        // Create new item.
        createItemAllowed(props) && {
          key: 'new',
          item: '+',
          handlers: ({io, path}) => [
            {
              key: 'enter',
              label: 'new item',
              fn: () => {
                // Get type of new item from schema.
                const newItem = newValueFromSchema(
                  itemSchema(props, value.length)
                )

                return onChange(value.concat([newItem])).then(() =>
                  io('/location', 'REPLACE', {
                    pathname: `/${pathSibling(path, toSafeKey(value.length))}`,
                  })
                )
              },
            },
          ],
        },
      ]
    },
  },
  object: {
    new: () => ({}),
    children: (props) => {
      const {value, onChange} = props

      return [
        map(value, (v, k) => {
          return {
            key: toSafeKey(k),
            item: ({io, path, params: {mode}}) =>
              mode !== 'edit' ? (
                k
              ) : (
                // Allow editing property name.
                <ItemEdit
                  value={k}
                  schema={{
                    type: 'string',
                    validator: (testK) => {
                      if (testK !== k && value.hasOwnProperty(testK)) {
                        return 'Duplicate key exists'
                      }
                    },
                  }}
                  onChange={(newK) => {
                    // Try to preserve key order.
                    return (
                      onChange(
                        fromPairs(
                          toPairs(value).map(
                            (pair) => (pair[0] === k ? [newK, pair[1]] : pair)
                          )
                        )
                      )
                        // Move to new path after making change.
                        .then(() =>
                          io('/location', 'REPLACE', {
                            pathname: `/${pathSibling(
                              path,
                              encodeURIComponent(toSafeKey(newK))
                            )}`,
                          })
                        )
                    )
                  }}
                />
              ),
            handlers: ({io, path, params: {mode}}) => [
              mode !== 'edit' && {
                key: 'enter',
                label: 'edit property',
                fn: () =>
                  io('/location', 'REPLACE', {
                    pathname: `/${path}`,
                    search: {mode: 'edit'},
                  }),
              },
              mode !== 'edit' &&
                createPropertyAllowed(props) && {
                  key: 'n',
                  label: 'new property',
                  fn: () => {
                    return io('/location', 'REPLACE', {
                      pathname: `/${pathSibling(path, 'new')}`,
                      search: {mode: 'edit'},
                    })
                  },
                },
              mode !== 'edit' &&
                deletePropertyAllowed(props, k) && {
                  key: 'backspace',
                  label: 'delete property',
                  fn: () => {
                    const index = indexOf(keys(value), k)
                    const newVal = omit(value, k)
                    const newKeys = keys(newVal)
                    const newCursorKey =
                      newKeys.length > index ? newKeys[index] : last(newKeys)
                    onChange(newVal).then(() =>
                      io('/location', 'REPLACE', {
                        pathname: `/${pathSibling(
                          path,
                          encodeURIComponent(toSafeKey(newCursorKey))
                        )}`,
                      })
                    )
                  },
                },
            ],
            children: nodesFromValue({
              value: v,
              schema: propertySchema(props, k),
              onChange: (newV) =>
                onChange({
                  ...value,
                  [k]: newV,
                }),
            }),
          }
        }),
        createPropertyAllowed(props) && {
          key: 'new',
          item: ({io, path, params: {mode}}) =>
            mode !== 'edit' ? (
              '+'
            ) : (
              <ItemEdit
                value={''}
                schema={{
                  type: 'string',
                  validator: (testK) => {
                    if (testK !== undefined && value.hasOwnProperty(testK)) {
                      return 'Duplicate key exists'
                    }
                  },
                }}
                onChange={(newK) => {
                  // Get value for new property from schema.
                  const newV = newValueFromSchema(propertySchema(props, newK))

                  return onChange({
                    ...value,
                    [newK]: newV,
                  }).then(() => {
                    io('/location', 'REPLACE', {
                      pathname: `/${pathSibling(
                        path,
                        encodeURIComponent(toSafeKey(newK))
                      )}`,
                    })
                  })
                }}
              />
            ),
          handlers: ({io, path, params: {mode}}) => [
            mode !== 'edit' && {
              key: 'enter',
              label: 'new property',
              fn: () =>
                io('/location', 'REPLACE', {
                  pathname: `/${path}`,
                  search: {mode: 'edit'},
                }),
            },
          ],
        },
      ]
    },
  },
}

function itemSchema(props) {
  const {schema} = props

  return !schema
    ? null
    : isObject(schema.items) && !isArray(schema.items)
      ? schema.items
      : // TODO: Handle tuple schema.
        null
}

function createItemAllowed(props) {
  const {onChange, schema} = props

  if (!onChange) {
    return false
  }

  // Tuple
  if (schema && isArray(schema.items) && schema.additionalItems === false) {
    return false
  }

  return true
}

function propertySchema(props, k) {
  const {schema} = props

  // TODO: Pattern properties
  return !schema
    ? null
    : schema.properties && schema.properties.hasOwnProperty(k)
      ? schema.properties[k]
      : isObject(schema.additionalProperties)
        ? schema.additionalProperties
        : null
}

function createPropertyAllowed(props) {
  const {schema, onChange} = props

  return onChange && (!schema || schema.additionalProperties !== false)
}

function deletePropertyAllowed(props, k) {
  const {schema, onChange} = props

  // TODO: Observe min/max.
  return (
    onChange &&
    (schema
      ? // Allow delete if key is not required.
        (schema.required || []).indexOf(k) === -1
      : true)
  )
}
