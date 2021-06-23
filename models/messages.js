const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    from:String,
    to:String,
    message:String,
    time : { type : Date, default: Date.now } ,
    read: {
        type: Boolean,
        default: false
    },
    msgReadId:String,
}) ;

module.exports = mongoose.model("Message",MessageSchema);
