# Mongen
It is a helper script to organise and initialize mongoose schemas, functions/methods and plugins. It takes care of the boiler plate code written to initialize mongoose models so that you can focus on the model features.  

You can take a look at [examples](https://github.com/abskmj/mongen-models) to get started.

## Example
```javascript
const mongoose = require('mongoose');
const mongen = require('@abskmj/mongen');

let connection = await mongoose.connect('mongodb://<user>:<password>@localhost:27017/test');

// initialize and load all the models
mongen.init(connection, __dirname + '/models');

let User = connection.model('User');
    
let user = new User({
    name: "ABC",
    email: "abc@xyz.com"
});
    
console.log(user.toJSON());
```