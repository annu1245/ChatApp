const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
    username:String,
    email:String,
    mobile:String,
    password:String,
    socketid:String,
}) ;
UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User",UserSchema);
