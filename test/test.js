const path = require('path')
const Schema = require('mongoose').Schema
const expect = require('chai').expect
const mongen = require('../index')

describe('Mongen', () => {
  let schemas

  before(async () => {
    schemas = mongen.loadSchemas(path.join(__dirname, '/models'))
  })

  it('should return schemas', () => {
    expect(schemas).to.be.an('object')
    expect(schemas).to.haveOwnProperty('Person')
    expect(schemas.Person).to.an.instanceOf(Schema)
  })

  it('should load schema from .schema.js file', () => {
    const personSchema = schemas.Person

    expect(personSchema.paths).to.be.an('object')
    expect(personSchema.paths).to.haveOwnProperty('name')
    expect(personSchema.paths).to.haveOwnProperty('email')
  })
})
