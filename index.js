const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fs = require('fs');
const path = require('path');

const debug = require('debug')('mongen');

module.exports.init = (connection, path, app) => {
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
            schemaDef = processObject(schemaDef);

            let schema = new Schema(schemaDef.schema, schemaDef.options);

            debug('created a new Schema from', modelDef.schema);
            debug('with options:', schemaDef.options);

            // attach functions
            if (modelDef.func) {
                const funcDef = require(modelDef.func)(schema, app);

                debug('attached functions from', modelDef.func);
            }

            // attach plugins
            if (schemaDef.plugins) {
                for (let pluginName in schemaDef.plugins) {

                    let pluginPath = defs.plugins[pluginName];
                    let plugin;

                    if (!pluginPath) {
                        // if plugin is not available in local
                        try {
                            plugin = require(pluginName);
                            pluginPath = require.resolve(pluginName);
                        }
                        catch (e) {
                            // if plugin is not available as module
                            throw new Error(`Plugin not found with name ${pluginName}`);
                        }
                    }
                    else {
                        plugin = require(pluginPath);
                    }


                    let options = schemaDef.plugins[pluginName];

                    // pass app into plugins
                    if (typeof(options) !== 'object') {
                        options = {};
                    }

                    options.app = app;

                    schema.plugin(plugin, options);

                    debug('attached plugin:', pluginName);
                    debug('with options:', JSON.stringify(options));
                    debug('from:', pluginPath)
                }
            }

            models[schemaDef.name] = mongoose.model(schemaDef.name, schema);

            debug('created a new model with name', schemaDef.name);
        }
    }
    
    function processObject (object) {
        for (let i in object) {        
            switch(typeof object[i]) {
                case "object":
                    object[i] = processObject(object[i]);
                    break;
                case "string":
                    object[i] = processString(object[i]);
                    break;
            }
        }
    
        return object;
    }
    
    function processString (string) {
        if (string.indexOf("$.") === 0) {
            string = string.substring(2, string.length);
            string = resolve(app, string);
        }

        return string;
    }  

    function resolve (obj, path) {
        path = path.split('.');
        let current = obj;

        while(path.length) {
            if(![ 'function', 'object' ].includes(typeof current)) return undefined;
            current = current[path.shift()];
        }

        return current;
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
