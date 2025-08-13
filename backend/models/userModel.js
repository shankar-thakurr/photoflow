const mongoose = require('mongoose');
const validator = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "please provide a username"],
    unique: true,
    trim: true,
    minLength: 3,
    maxLength: 20,
    index: true,
  },
  email: {
    type: String,
    required: [true, "please provide an email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "please provide a password"],
    minLength: 6,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "please confirm your"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "passwords are not the same",
    },
  },
  profilePicture: {
    type: String,
  },
  bio: {
    type: String,
    maxLength: 200,
    default: "",
  },
  follwers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  follwings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  savedPosts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },
  resetPasswordOTP:{
    type:String,
    default:null
  },
  resetPasswordOTPExpires:{
    type:Date,
    default:null
  },
  createdAt:{
    type:Date,
    default:Date.now,
  },
//   updatedAt:{
//     type:Date,
//     default:Date.now,
//   },

},{timeseries:true}
);

userSchema.pre("save", async function (next) {
  if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 12);
  
    this.passwordConfirm = undefined;
    next();
  })

userSchema.methods.correctPassword = async function(userPasword, databasePassword){
  return await bcrypt.compare(userPasword, databasePassword)
}

const user = mongoose.model("User", userSchema);
module.exports = user;
