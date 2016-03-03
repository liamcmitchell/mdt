import jsonschema from 'jsonschema'

const validator = new jsonschema.Validator()

// Allow validator property in schema.
validator.attributes.validator = function(instance, schema, options, ctx) {
  if (typeof schema.validator !== 'function') {
    throw new jsonschema.SchemaError('"validator" expects a function', schema)
  }
  return schema.validator.call(null, instance)
}

export default validator.validate.bind(validator)
