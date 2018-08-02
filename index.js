const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fs = require('fs');
const path = require('path');

const debug = require('debug')('mongen');

module.exports.init = (connection, path) => {

    if (!connection || !connection.model) {
        throw new Error('Please provide a mongoose / connection');
    }

    if (!path) {
        throw new Error('Please provide models directory path');
    }

    let defs = {
        models: {},
        plugins: {}
    };

    walkDirectory(defs, path);

    debug('//=== starting model processing ===//');

    let models = {};

    for (let modelKey in defs.models) {
        debug('model key:', modelKey);
        const modelDef = defs.models[modelKey];

        if (modelDef.schema) {
            const schemaDef = require(modelDef.schema);
            let schema = new Schema(schemaDef.schema, schemaDef.options);

            debug('created a new Schema from', modelDef.schema);
            debug('with options:', schemaDef.options);

            if (modelDef.func) {
                const funcDef = require(modelDef.func)(schema);

                debug('attached functions from', modelDef.func);
            }

            if (schemaDef.plugins) {
                for (let pluginName in schemaDef.plugins) {
                    let plugin = defs.plugins[pluginName];
                    if (!plugin) {
                        throw new Error(`Plugin not found with name ${pluginName}`);
                    }
                    else {
                        let options = schemaDef.plugins[pluginName];
                        schema.plugin(require(plugin), options);

                        debug('attached plugin from', plugin);
                        debug('with options:', JSON.stringify(options));
                    }
                }
            }

            models[schemaDef.name] = mongoose.model(schemaDef.name, schema);

            debug('created a new model with name', schemaDef.name);
        }
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
