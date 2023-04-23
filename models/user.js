const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {required: true, minLength: 3, type: String},
    password: {required: true, type: String},
    facebook: {type: String},
    outgoing: [{type: Schema.Types.ObjectId, ref: "User"}],
    incoming: [{type: Schema.Types.ObjectId, ref: "User"}],
    friends: [{type: Schema.Types.ObjectId, ref: "User"}]
})

module.exports = mongoose.model("User", userSchema);