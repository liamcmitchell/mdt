import React from "react"
import PropTypes from "lib/proptypes"
import _ from "underscore"
import Item from "components/item"
import TypeItem from "components/type-item"
import NumberItem from "components/number-item"
import StringItem from "components/string-item"
import PropertyItem from "components/property-item"

// Root input component.
// For now input will always consume an entire column, even for a single string.
// Need to figure out if it is at all possible to inline edit and
// keep the UI consistent. Most input will require a label which would be
// difficult to display alongside the value.

const InputNull = "div"
const InputBoolean = "div"
const InputNumber = "div"
const InputString = "div"
const InputArray = "div"
const InputObject = "div"

const TYPES = [
  {
    name: "null",
    input: InputNull,
    default: null
  },
  {
    name: "boolean",
    input: InputBoolean,
    default: true
  },
  {
    name: "number",
    input: InputNumber,
    default: 0
  },
  {
    name: "string",
    input: InputString,
    default: ""
  },
  {
    name: "array",
    input: InputArray,
    default: []
  },
  {
    name: "object",
    input: InputObject,
    default: {}
  }
]

function getType(name) {
  const type = TYPES.find(t => t.name === name)
  if (!type) {
    throw new Error("Type not found for " + name)
  }
  return type
}

function getRawTypeName(value) {
  if (_.isNull(value)) return "null"
  if (_.isBoolean(value)) return "boolean"
  if (_.isNumber(value)) return "number"
  if (_.isString(value)) return "string"
  if (_.isArray(value)) return "array"
  if (_.isObject(value)) return "object"
}

export default React.createClass({
  propTypes: {
    value: PropTypes.JSON,
    onValueChange: React.PropTypes.func.isRequired,
    schema: React.PropTypes.object
  },

  getDefaultProps() {
    return {
      value: null,
      schema: {}  
    }
  },

  render() {
    // Schema overrides.
    if (this.props.schema.input) {
      return React.createElement(this.props.schema.input, this.props)
    }
    else {
      return (
        <Item {...this.props}>
          {this._renderTypeItem()}
          {this._renderTypeInput()}
        </Item>
      )
    }
  },

  _renderTypeItem() {
    // Add type selector if type is not specified.
    if (!this.props.schema.type) {
      return (
        <TypeItem
          key="type"
          value={this._getTypeName()}
          onValueChange={this._handleTypeChange}
          types={_.pluck(TYPES, "name")}
        />
      )
    }
  },

  _handleTypeChange(newTypeName) {
    if (this.savedValues === undefined) {
      this.savedValues = {}
    }
    // Save type so we can switch back and keep previous state.
    this.savedValues[this._getTypeName()] = this.props.value
    // Emit last saved value of the new type or use default.
    this.props.onValueChange(
      this.savedValues.hasOwnProperty(newTypeName) ?
        this.savedValues[newTypeName] :
        getType(newTypeName).default
    )
  },

  // Render everything else dynamically based on type.
  _renderTypeInput() {
    var type = this._getTypeName()

    if (type === "null") {
      return null
    }

    if (type === "boolean") {
      return (
        <Item
          key="boolean"
          node={this.props.value ? "true" : "false"}
          keyHandlers={{
            enter: this._handleBooleanActivate
          }}
        />
      )
    }

    if (type === "number") {
      return (
        <NumberItem
          key="number"
          value={this.props.value}
          onValueChange={this._handleNumberChange}
        />
      )
    }

    if (type === "string") {
      return (
        <StringItem
          key="string"
          value={this.props.value}
          onValueChange={this._handleStringChange}
        />
      )
    }

    if (type === "object") {
      return _.map(this.props.value, (value, name) => {
        return (
          <PropertyItem
            key={"key:" + name}
            object={this.props.value}
            name={name}
            onNameChange={this._handlePropertyNameChange.bind(null, name)}
            value={value}
            onValueChange={this._handlePropertyValueChange.bind(null, name)}
            onDelete={this._handlePropertyDelete.bind(null, name)}
          />
        )
      }).concat(
        <Item
          key="new"
          node="+ new property"
          keyHandlers={{
            enter: this._handleNewProperty
          }}
        />
      )
    }

    if (type === "array") {
      return "unknown type [" + type + "]"
    }

    return "unknown type [" + type + "]"
  },

  _handleBooleanActivate() {
    this.props.onValueChange(!this.props.value)
  },

  _handleNumberChange(value) {
    this.props.onValueChange(value)
  },

  _handleStringChange(value) {
    this.props.onValueChange(value)
  },

  _handlePropertyNameChange(currentName, newName) {
    // Move value.
    var value = _.clone(this.props.value)
    value[newName] = value[currentName]
    delete value[currentName]
    // Move selection to new key. Needs to happen before propagating value.
    // this.props.cursor.focusChild("key:" + newName);
    // And propagate new value.
    this.props.onValueChange(value)
  },

  _handlePropertyValueChange(pName, pValue) {
    // Update value.
    var value = _.clone(this.props.value)
    value[pName] = pValue
    this.props.onValueChange(value)
  },

  _handlePropertyDelete(name) {
    // Update value.
    var value = _.clone(this.props.value)
    delete value[name]
    // Find next item to select.
    var keys = _.keys(this.props.value)
    var index = keys.indexOf(name)
    var nextKey = keys[index + 1] || keys[index - 1]
    this.props.cursor.focusChild(nextKey ? "key:" + nextKey : "new")
    this.props.onValueChange(value)
  },

  _handleNewProperty() {
    var name = "new property"
    var i = 1
    while (this.props.value.hasOwnProperty(name)) {
      name = "new property " + i++
    }
    var value = _.clone(this.props.value)
    value[name] = null
    // Activate new key. Needs to happen before propagating value.
    this.props.cursor.focusChild("key:" + name)
    this.props.onValueChange(value)
  },

  _getType() {
    return getType(this._getTypeName())
  },

  _getTypeName() {
    // Schema overrides.
    return this.props.schema.type || getRawTypeName(this.props.value)
  }
})
