module.exports = (schema, options) => {
  schema.add({
    createdAt: {
      type: Date,
      default: new Date()
    }
  })
}
