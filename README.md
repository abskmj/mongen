# Mongen

```javascript
let mongen = require("@abskmj/mongen");

mongen.init({
    mongo:'mongodb://<user>:<passowrd>@localhost:27017/test',
    path: __dirname + '/models'
}, (error, mongoose) =>{
     let User = mongoose.model('User');
    
    let user = new User({
        name: "ABC",
        email: "abc@xyz.com"
    });
    
    console.log(user.fullName);
});



```