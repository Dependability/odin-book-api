const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    author: {type: Schema.Types.ObjectId, ref: "User", required: true},
    text: {type: String, required: true, minLength: 1},
    post: {type: Schema.Types.ObjectId, ref: "Post", required: true}
})

module.exports = mongoose.model("Comment", commentSchema);