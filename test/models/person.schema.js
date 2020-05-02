module.exports = {
  name: 'Person',
  plugins: {
    timestamps: true
  },
  schema: {
    name: {
      first: String,
      last: String
    },
    email: String
  },
  options: {}
}
