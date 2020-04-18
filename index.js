const assert = require('assert')
const Schema = require('mongoose').Schema

const fs = require('fs')
const path = require('path')

const debug = require('debug')('mongen')

module.exports.init = (path, app) => {
  debug('Path provided:', path)
  // validate if path exists and is a directory
  assert(path, 'Path provided is not valid')
  assert(fs.existsSync(path), 'Path provided doesn\'t exists')
  assert(fs.lstatSync(path).isDirectory(), 'Path provided is not a directory')

  const defs = {
    models: {},
    plugins: {}
  }

  walkDirectory(defs, path)

  debug('//=== starting model processing ===//')

  const models = {}

  for (const modelKey in defs.models) {
    debug('model key:', modelKey)
    const modelDef = defs.models[modelKey]

    if (modelDef.schema) {
      const schemaDef = require(modelDef.schema)

      const schema = new Schema(schemaDef.schema, schemaDef.options)

      debug('created a new Schema from', modelDef.schema)
      debug('with options:', schemaDef.options)

      // attach functions
      if (modelDef.func) {
        require(modelDef.func)(schema, app)

        debug('attached functions from', modelDef.func)
      }

      // attach plugins
      if (schemaDef.plugins) {
        for (const pluginName in schemaDef.plugins) {
          let pluginPath = defs.plugins[pluginName]
          let plugin

          if (!pluginPath) {
            // if plugin is not available in local
            try {
              plugin = require(pluginName)
              pluginPath = require.resolve(pluginName)
            } catch (e) {
              // if plugin is not available as module
              throw new Error(`Plugin not found with name ${pluginName}`)
            }
          } else {
            plugin = require(pluginPath)
          }

          let options = schemaDef.plugins[pluginName]

          // pass app into plugins
          if (typeof (options) !== 'object') {
            options = {}
          }

          options.app = app

          schema.plugin(plugin, options)

          debug('attached plugin:', pluginName)
          debug('with options:', JSON.stringify(options))
          debug('from:', pluginPath)
        }
      }

      models[schemaDef.name] = schema

      debug('created a new model with name', schemaDef.name)
    }
  }

  return models
}

const walkDirectory = (defs, directoryPath) => {
  const schemaExtension = '.schema.js'
  const functionExtention = '.func.js'
  const pluginExtension = '.plugin.js'

  const files = fs.readdirSync(directoryPath)

  files.forEach(file => {
    const filepath = path.join(directoryPath, file)
    debug('current file:', filepath)

    if (fs.statSync(filepath).isDirectory()) {
      debug('is a directory')
      walkDirectory(defs, filepath)
    } else {
      if (file.endsWith(schemaExtension)) {
        debug('is a schema file')

        const name = file.split(schemaExtension)[0]

        debug('model name:', name)

        if (!defs.models[name]) {
          defs.models[name] = {}
        }

        defs.models[name].schema = filepath
      } else if (file.endsWith(functionExtention)) {
        debug('is a function file')

        const name = file.split(functionExtention)[0]

        debug('model name:', name)

        if (!defs.models[name]) {
          defs.models[name] = {}
        }

        defs.models[name].func = filepath
      } else if (file.endsWith(pluginExtension)) {
        debug('is a plugin file')

        const name = file.split(pluginExtension)[0]

        debug('plugin name:', name)

        if (!defs.plugins[name]) {
          defs.plugins[name] = {}
        }

        defs.plugins[name] = filepath
      } else {
        console.log('file with unknown purpose', filepath)
      }
    }
  })
}
