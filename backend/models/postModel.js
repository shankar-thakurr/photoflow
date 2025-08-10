const mongose = require("mongoose");
const { create } = require("./userModel");
const { default: mongoose } = require("mongoose");


const postSchema = new mongose.Schema({
    caption:{
        type:String,
        maxLength:[2200,"Caption should be less than 2200 characters"],
        trim:true
    },
    image:{
        url:{
            type:String,
            required:true
        },
        publicId:{
            type:String,
            required:true
        }
    },
    user:{
        type:mongose.Schema.Types.ObjectId,
        ref:"User",
        required:[true,"User id is required"],

    },
    likes:[
        {
            type:mongose.Schema.Types.ObjectId,
            ref:"User",
        }
    ],
    comments:[
        {
            type:mongose.Schema.Types.ObjectId,
            ref:"Comment",
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
},{
    timestamps:true
})

postSchema.index({ user:1, createdAt: -1 })

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
