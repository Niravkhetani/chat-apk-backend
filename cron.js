const mongoose = require('mongoose');

const connectAndDrop = () => {

    mongoose.connect('mongodb://localhost:27017/razgovorChat',function(){
	    mongoose.connection.db.dropDatabase();
//	    mongoose.connection.db.collection('chat').drop()
    }).then(()=>{console.log("database removed")})

}

connectAndDrop();
