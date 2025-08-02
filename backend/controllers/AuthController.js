const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const generateOtp = require("../utils/generateOtp");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const hbs = require("hbs");
const sendEmail = require("../utils/email");
const appError = require("../utils/appError");
// const { title } = require("process");

const loadTemplate = (templateName,replacemets)=>{
    const templatePath = path.join(__dirname ,'../emailTemplate',templateName)
    const source = fs.readFileSync(templatePath ,"utf-8");
    const template = hbs.compile(source);
    return template(replacemets);
}


const signToken = (id) =>{
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    })
}

const createSendToken = (user, statusCode, res,meassage) =>{
    const token =signToken(user.id);
    const cookieOptions = {
        expires:new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 69 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    }
    res.cookie("takone", token, cookieOptions);
    user.password = undefined;
    user.passwordConfirm = undefined;
    user.otp =undefined;
    res.status(statusCode).json({
        status:"success",
        meassage,
        token,
        data:{
            user,
        }
    })
}


exports.signup = catchAsync(async (req, res, next) => {
    const {email, password, passwordConfirm , username} = req.body;
    const existingUser = await User.findOne({email})

    if(existingUser){
        return next(new AppError("Email already registered", 400))
    }
    const otp= generateOtp()
    const optExpires=Date.now() + 24 * 60 * 60 * 100;
    const newUser = await User.create({
        username,
        email,
        password,
        passwordConfirm,
        otp: otp,
        otpExpires: optExpires,
        role: "user",
    })
    
    const htmlTemplate = loadTemplate("otpTemplate.hbs", {
      title: "Otp-Verification",
      username: newUser.username,
      otp: otp,
      message:
        "Your one-time password (OTP) for account verification",
    });
    try {
        await sendEmail({
          email: newUser.email,
          subject: "OTP for Email Verification",
          html:htmlTemplate
        });

        createSendToken(
          newUser,
          200,
          res,
          "Registered Successfully. Check your email for verification"
        );
    } catch (error) {
        console.log(error);
        await User.findByIdAndDelete(newUser._id)
        return next(
          new appError(
            "There was an error sending the email. Try again later!",
            500
          )
        );
    }
    
    

});
