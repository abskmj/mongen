module.exports = (personSchema) => {
  personSchema.virtual('fullName').get(function () {
    return this.name.first + ' ' + this.name.last
  })
}
