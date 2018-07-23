const promise = require('bluebird');

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fs = require('fs');
const debug = require('debug')('mongen');
const path = require('path');


module.exports.init = (options, callback) => {
    try {

        options = options || {};

        if (!options.mongo) {
            throw new Error('Please provide a mongo connection url');
        }

        if (!options.path) {
            throw new Error('Please provide models directory path');
        }

        return mongoose.connect(options.mongo)
            .then(() => {
                debug('database connection successful');

                let defs = {
                    models: {},
                    plugins: {}
                };

                walkDirectory(defs, options.path);

                debug('//=== starting model processing ===//');

                let models = {};

                for (let modelKey in defs.models) {
                    debug('model key:', modelKey);
                    const modelDef = defs.models[modelKey];

                    if (modelDef.schema) {
                        const schemaDef = require(modelDef.schema);
                        let schema = new Schema(schemaDef.schema);

                        debug('created a new Schema from', modelDef.schema);

                        if (modelDef.func) {
                            const funcDef = require(modelDef.func)(schema);

                            debug('attached functions from', modelDef.func);
                        }


                        if (schemaDef.plugins) {
                            schemaDef.plugins.forEach((pluginName) => {
                                let plugin = defs.plugins[pluginName];
                                if (!plugin) {
                                    throw new Error('Plugin not found:', pluginName);
                                }
                                else {
                                    schema.plugin(require(plugin));

                                    debug('atteched plugin from', plugin);
                                }
                            });
                        }

                        models[schemaDef.name] = mongoose.model(schemaDef.name, schema);

                        debug('created a new model with name', schemaDef.name);
                    }
                }

                return promise.resolve(mongoose).asCallback(callback);
            });
    }
    catch (error) {
        return promise.reject(error).asCallback(callback);
    }
}

let walkDirectory = (defs, directoryPath) => {
    const schemaExtension = '.schema.js';
    const functionExtention = '.func.js';
    const pluginExtension = '.plugin.js';

    let files = fs.readdirSync(directoryPath);

    files.forEach(file => {
        let filepath = path.join(directoryPath, file);
        debug('current file:', filepath);

        if (fs.statSync(filepath).isDirectory()) {
            debug('is a directory');
            walkDirectory(defs, filepath);
        }
        else {
            if (file.endsWith(schemaExtension)) {
                debug('is a schema file');

                let name = file.split(schemaExtension)[0];

                debug('model name:', name);

                if (!defs.models[name]) {
                    defs.models[name] = {}
                }

                defs.models[name].schema = filepath;
            }
            else if (file.endsWith(functionExtention)) {
                debug('is a function file');

                let name = file.split(functionExtention)[0];

                debug('model name:', name);

                if (!defs.models[name]) {
                    defs.models[name] = {}
                }

                defs.models[name].func = filepath;
            }
            else if (file.endsWith(pluginExtension)) {
                debug('is a plugin file');

                let name = file.split(pluginExtension)[0];

                debug('plugin name:', name);

                if (!defs.plugins[name]) {
                    defs.plugins[name] = {}
                }

                defs.plugins[name] = filepath;
            }
            else {
                console.log('file with unknown purpose', filepath);
            }

        }
    });
}
