const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const fs = require('fs');
const debug = require('debug')('mongen');
const path = require('path');

module.exports.init = (options, callback) => {
    options = options || {};

    if (!options.mongo) {
        throw new Error('Please provide a mongo connection url');
    }

    if (!options.path) {
        throw new Error('Please provide models directory path');
    }

    mongoose.connect(options.mongo);
    mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
    mongoose.connection.once('open', () => {
        debug('database connection successful');

        let defs = {};

        walkDirectory(defs, options.path);

        debug('//=== starting model processing ===//');
        
        let models = {};

        for (let modelKey in defs) {
            debug('model key:', modelKey);
            const modelDef = defs[modelKey];

            if (modelDef.schema) {
                const schemaDef = require(modelDef.schema);
                let schema = new Schema(schemaDef.schema);

                debug('created a new Schema from', modelDef.schema);

                if (modelDef.func) {
                    const funcDef = require(modelDef.func)(schema);
                    
                    debug('attached functions from', modelDef.func);
                }
                
                models[schemaDef.name] = mongoose.model(schemaDef.name, schema);
                
                debug('created a new model with name', schemaDef.name);
            }
        }
        
        callback(null, mongoose);
    });
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

                if (!defs[name]) {
                    defs[name] = {}
                }

                defs[name].schema = filepath;
            }
            else if (file.endsWith(functionExtention)) {
                debug('is a function file');

                let name = file.split(functionExtention)[0];

                debug('model name:', name);

                if (!defs[name]) {
                    defs[name] = {}
                }

                defs[name].func = filepath;
            }
            else{
                console.log('file with unknown purpose', filepath);
            }

        }
    });
}
