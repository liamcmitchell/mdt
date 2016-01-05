import React, { Component } from "react"
import PropTypes from "lib/proptypes"
import _ from "underscore"
import Node from "components/node"
import NodeItem from "components/node-item"
import NodeContent from "components/node-content"
import SelectNode from "components/select-node"
import ObjectInputNode from "components/object-input-node"

// import Item from "components/item";
// import TypeItem from "components/type-item";
// import NumberItem from "components/number-item";
// import StringItem from "components/string-item";
// import PropertyItem from "components/property-item";

// Root input component.
// For now input will always consume an entire column, even for a single string.
// Need to figure out if it is at all possible to inline edit and
// keep the UI consistent. Most input will require a label which would be
// difficult to display alongside the value.

const NullInputNode = "div"
const BooleanInputNode = "div"
const NumberInputNode = "div"
const StringInputNode = "div"
const ArrayInputNode = "div"

const DEFAULT_SCHEMAS = [
  {
    type: "null",
    node: null,
    default: null
  },
  {
    type: "boolean",
    node: BooleanInputNode,
    default: true
  },
  {
    type: "number",
    node: NumberInputNode,
    default: 0
  },
  {
    type: "string",
    node: StringInputNode,
    default: ""
  },
  {
    type: "array",
    node: ArrayInputNode,
    default: []
  },
  {
    type: "object",
    node: ObjectInputNode,
    default: {}
  }
]

function getSchema(type) {
  const schema = DEFAULT_SCHEMAS.find(t => t.type === type)
  if (!schema) {
    throw new Error("Schema not found for type " + type)
  }
  return schema
}

function getType(value) {
  if (_.isNull(value)) return "null"
  if (_.isBoolean(value)) return "boolean"
  if (_.isNumber(value)) return "number"
  if (_.isString(value)) return "string"
  if (_.isArray(value)) return "array"
  if (_.isObject(value)) return "object"
}

class InputNode extends Component {
  static isNode = true

  static propTypes = {
    value: PropTypes.JSON,
    onValueChange: React.PropTypes.func.isRequired,
    schema: React.PropTypes.object
  }

  static defaultProps = {
    value: null,
    schema: {}
  }

  constructor(props, context) {
    super(props, context)

    this.state = {
      selectingType: false
    }
  }

  render() {
    return <Node {...this.props}>
      <NodeItem>
        {this.props.text || this._getType()}
      </NodeItem>
      <NodeContent>
        {this._renderTypeNode()}
        {this._renderValueNode()}
      </NodeContent>
    </Node>
  }

  _renderTypeNode() {
    // Don't show select if type is set.
    if (this.props.schema.type) {
      return null
    }

    const type = this._getType()

    return <SelectNode
      key="type"
      text={"[" + type + "]"}
      value={type}
      options={DEFAULT_SCHEMAS.map(s => s.type)}
      onValueChange={this._handleTypeChange.bind(this)}
    />
  }

  _renderValueNode() {
    // Schema overrides.
    const schema = this.props.schema
    const type = schema.type || getType(this.props.value)
    const ValueNode = schema.node || getSchema(type).node
    return type === "null" ?
      null :
      <ValueNode
        {...this.props}
        key="value"
      />
  }

  _renderTypeItem() {
    // Add type selector if type is not specified.
    if (!this.props.schema.type) {
      return (
        <TypeItem
          key="type"
          value={this._getType()}
          onValueChange={this._handleTypeChange}
          types={_.pluck(DEFAULT_SCHEMAS, "name")}
        />
      )
    }
  }

  _handleTypeChange(newTypeName) {
    if (this.savedValues === undefined) {
      this.savedValues = {}
    }
    // Save type so we can switch back and keep previous state.
    this.savedValues[this._getType()] = this.props.value
    // Emit last saved value of the new type or use default.
    this.props.onValueChange(
      this.savedValues.hasOwnProperty(newTypeName) ?
        this.savedValues[newTypeName] :
        getSchema(newTypeName).default
    )
  }

  // Render everything else dynamically based on type.
  _renderTypeInput() {
    var type = this._getType()

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
  }

  _handleBooleanActivate() {
    this.props.onValueChange(!this.props.value)
  }

  _handleNumberChange(value) {
    this.props.onValueChange(value)
  }

  _handleStringChange(value) {
    this.props.onValueChange(value)
  }

  _handlePropertyNameChange(currentName, newName) {
    // Move value.
    var value = _.clone(this.props.value)
    value[newName] = value[currentName]
    delete value[currentName]
    // Move selection to new key. Needs to happen before propagating value.
    // this.props.cursor.focusChild("key:" + newName);
    // And propagate new value.
    this.props.onValueChange(value)
  }

  _handlePropertyValueChange(pName, pValue) {
    // Update value.
    var value = _.clone(this.props.value)
    value[pName] = pValue
    this.props.onValueChange(value)
  }

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
  }

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
  }

  _getSchema() {
    return getSchema(this._getType())
  }

  _getType() {
    // Schema overrides.
    return this.props.schema.type || getType(this.props.value)
  }
}

export default InputNode
