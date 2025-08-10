const mongoose = require("mongoose");
const { trim } = require("validator");

const commentShema = new mongoose.Schema({
    text:{
        type:String,
        required:[true,"Comment text is required"],
        trim:true,
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    updatedAt:{
        type:Date,
        default:Date.now
    }
},{
    timestamps:true
})

const Comment = mongoose.model("Comment",commentShema);
module.exports = Comment

