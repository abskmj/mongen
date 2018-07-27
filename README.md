# Mongen
It is a helper script to organise and initialize mongoose schemas, functions/methods and plugins. You can take a look at [examples](https://github.com/abskmj/mongen-models) to get started.

```javascript
let mongen = require("@abskmj/mongen");

mongen.init({
    mongo:'mongodb://<user>:<password>@localhost:27017/test',
    path: __dirname + '/models'
}, (error, mongoose) =>{
    let User = mongoose.model('User');
    
    let user = new User({
        name: "ABC",
        email: "abc@xyz.com"
    });
    
    console.log(user.toJSON());
});
```