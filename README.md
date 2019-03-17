# Mongen
Mongen is a helper script to load and attach mongoose models from an organized file structure.

# Installation
```
npm install -S github:abskmj/mongen
```

# Usage
```javascript
const mongoose = require('mongoose');
const express = require('express');

const mongen = require('@abskmj/mongen');

let app = express();

mongen.init(mongoose, __dirname + '/models', app); // loads and attachs model definations

let User = mongoose.model('User'); // model functions are available like User.find();
```

# Functions
## Mongen.init(connection, path, app)
It loads all the definition files and attaches mongoose models to the `connection` parameter.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| connection | Object |A `mongoose` or `mongoose.Connection` instance |
| path | String | Absolute path to a local folder containing the definition files |
| app | Object | An object that may an express app or a bundle of service |

# Definition / File Types
## Model
A model can be defined in two types of file
- `.schema.js` which contains schema properties, options, plugins to be attached
- `.func.js` which contains vituals, schema methods and statics, middlewares

## Plugin
A plugin can be defined in a `.plugin.js` file.

# Schema Definition (.schema.js)
It returns a JSON with below properties.

| Property | Type | Description |
| :--- | :--- | :--- |
| name | String | Name of the model |
| schema | Object | Defination parameter to `mongoose.Schema` [constructor](https://mongoosejs.com/docs/api.html#schema_Schema) |
| options | Object | Options parameter to `mongoose.Schema` [constructor](https://mongoosejs.com/docs/api.html#schema_Schema) |
| plugins | Object | Map of plugins and their options attached to the model |

## Example
```javascript
module.exports = {
  name: 'User',
  schema: {
    firstName: {
      type: String,
      required: true
    },
    lastName: String
  },
  options: { versionKey: false },
  plugins: { 'timestamps': { createdAt: true }}
}
```

## How it works?
```javascript
let schemaDef = require('User.schema.js');

let schema = new mongoose.Schema(schemaDef.schema, schemaDef.options);

// how plugins are attached is discussed later

let User = mongoose.model(schemaDef.name, schema);
```
## Plugins as NPM modules
Mongen can also attach mongoose plugins that are installed as npm modules. Mongoose will search for plugin definition in local path first, if not found, for an installed npm module with the same name.
```javascript
// user.schema.js
module.exports = {
  name: 'user',
  schema: {
    name: String
  },
  plugins: {
    'mongoose-lean-virtuals': {} // or true
  }
}
```

# Function Definition (.func.js)
It returns a function which accepts a `mongoose.Schema` and the `app` parameter of mongen.

## Example
```javascript
module.exports = (schema, app) => {
  schema.virtual('Fullname').get(function(){
    let fullName = this.firstName;

    if(this.lastName){
      fullName += ' ';
      fullName += this.lastName;
    }

    return fullName;
  });
}
```

## How it works?
```javascript
let schema = new mongoose.Schema({ ... });
let funcDef = require('User.func.js');

funcDef(schema, app);
```

# Plugin Definition (.plugin.js)
It returns a function which accepts a `mongoose.Schema` and an options object. This is can be used as a traditional [mongoose plugin](https://mongoosejs.com/docs/plugins.html).

## Example
```javascript
module.exports = (schema, options) => {
  if(options.createdAt){
    schema.add({
      createdAt: Date,
      default: Date.now
    });
  }

  schema.add({
    modifiedAt: Date
  });

  // app parameter is also available at options.app for all plugin definations
}
```

## How it works?
```javascript
let schema = new mongoose.Schema({ ... });
let plugin = require('timestamps.plugin.js');
let options = schemaDef.plugins.timestamps;

schema.plugin(plugin, options);
```

# Why Mongen?
Mongen is a helper script to load and attach mongoose models from an organized file structure. The definition / file type clearly call out which aspect of the model functionality is present in them. Mongen scans the given `path` recursively giving the ability to structure the files by functionality or modules. Mongen also automatically creates schema objects, attaches schema functions and plugins. 

## Traditional vs Mongen File Structure
```
// traditional
|-- models
  |-- user.js
  |-- post.js
  |-- timestamps.js

// mongen
|-- models
  |-- user.schema.js
  |-- user.func.js
  |-- post.schema.js
  |-- timestamps.plugin.js  
```

## Traditional vs Mongen Code
Traditionally, a single file contains model code with schema, functions and plugins. Each member in the team might end up writing the models in their own way. Here is an example,

```javascript
const mongoose = require('mongoose');

// define schema
let schema = new mongoose.Schema({
    firstName: {
      type: String,
      required: true
    },
    lastName: String
});

// attach functions
schema.virtual('Fullname').get(function(){
  let fullName = this.firstName;

  if(this.lastName){
    fullName += ' ';
    fullName += this.lastName;
  }

  return fullName;
});

// attach plugins
const plugin = require('./timestamps.js');
schema.plugin(plugin);

// export model
module.exports = mongoose.model('User', schema);
```

With mongen, each aspect of the model functionality is written in an organized file structure.