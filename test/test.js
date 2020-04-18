const expect = require('chai').expect
const mongoose = require('mongoose')

const mongen = require('../index')
const config = require('../config.json')

describe('Mongen', () => {
  let connection

  before(async () => {
    connection = await mongoose.connect(config.mongo, { useNewUrlParser: true })
    mongen.init(connection, __dirname + '/models')
  })

  it('should initialize model', () => {
    const Person = connection.model('Person')

    expect(Person).to.not.equal(null)
    expect(Person).to.not.equal(undefined)
  })

  it('should create a new model instance', async () => {
    const Person = connection.model('Person')

    const person = new Person({
      name: 'ABC',
      email: 'abc@xyz.com'
    })

    const saved = await person.save()

    expect(saved.name).to.equal('ABC')
  })
})
