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
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    }
    res.cookie("token", token, cookieOptions);
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
    const newUser = new User({
        username,
        email,
        password,
        passwordConfirm,
        otp: otp,
        otpExpires: optExpires,
        role: "user",
    })
    await newUser.save();
    
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


exports.verifyAccount = catchAsync(async(req,res,next)=>{
    const {otp} =req.body;
    if(!otp){
        return next(new appError("Otp is required for verification",400))
    }
    const user = req.user;
    if(user.otp !== otp){
        return next(new appError("Otp is not valid",400))
    }
    if(Date.now() > user.otpExpires){
        return next(
          new appError("Otp has been expired. Please request a new one OTP", 400)
        );
    }
    user.isVerified = true;
    user.otp=undefined;
    user.optExpires= undefined

    await user.save({validateBeforeSave:false})

    createSendToken(user, 200, res, "Account verified successfully");
    
})

exports.resendOtp= catchAsync(async(req,res,next)=>{
    
    const email = req.user.email;
    if(!email){
        return next(new appError("Email is required",400))
    }
    
    const user = await User.findOne({email})

    if(!user){
        return next(new appError("User not found",404))
    }

    if(user.isVerified){
        return next(new appError("This Account is already verified",400))
    }

    const otp = generateOtp();
    const otpExpires = Date.now() + 24 * 60 * 60 * 1000;

    user.otp=otp;
    user.otpExpires=otpExpires;

    await user.save({validateBeforeSave:false})

      const htmlTemplate = loadTemplate("otpTemplate.hbs", {
      title: "Otp-Verification",
      username: user.username,
      otp: otp, 
      message:
        "Your one-time password (OTP) for account verification",
    });
    try {
        await sendEmail({
            email:user.email,
            subject:"Resend otp for Email Verification",
            html:htmlTemplate
        })

        res.status(200).json({
            status:"success",
            message:"A New OTP is Send to Your email",
        })
    } catch (error) {
        user.otp=undefined;
        user.otpExpires=undefined;
        await user.save({validateBeforeSave:false})
        return next(
          new appError(
            "There was an error sending the email. Try again later!",
            500
          )
        );
    }
})

exports.login = catchAsync(async(req,res,next)=>{
    const {email, password} = req.body;
    if(!email || !password){
        return next(new appError("Please provide email and password",400))
    }
    const user = await User.findOne({email}).select("+password");
    
    console.log(user)
    if(!user || !(await user.correctPassword(password, user.password))){
        return next(new appError("Incorrect email or password",401))
    }
    createSendToken(user, 200, res, "Logged in successfully")

})

exports.logout = catchAsync(async(req,res,next)=>{
    res.cookie("token", "loggedout", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    })
    res.status(200).json({
        status:"success",
        message:"Logged out successfully"
    })
})

exports.forgotPassword = catchAsync(async(req,res,next)=>{
    const {email} = req.body
    console.log('forgotPassword email:', email);
    const user = await User.findOne({email})

    if(!user){
        return next(new appError("No User found",404))
    }

    const otp=generateOtp()
    const resetExpires = Date.now() + 300000; 
    
    user.resetPasswordOTP=otp
    user.resetPasswordOTPExpires = resetExpires

    await user.save({validateBeforeSave:false})

    const htmlTemplate = loadTemplate("otpTemplate.hbs", {
      title: "Reset Password OTP",
      username: user.username,
      otp:otp,
      message:
        "Your one-time password (OTP) for resetting your password",
      })
    
      try {
        await sendEmail({
          email: user.email,
          subject: "Reset Password OTP. (Valid for 5 minutes)",
          html: htmlTemplate,
          });

        res.status(200).json({
        status:"success",
        message:"A New OTP is Send to Your email",
             })

      } catch (error) {
        user.resetPasswordOTP=undefined;
        user.resetPasswordOTPExpires=undefined;
        await user.save({validateBeforeSave:false})
        return next(new appError("There was an error sending the email. Try again later!",500
        ))
      } 
})

exports.resetPassword = catchAsync(async(req,res,next)=>{
        const {email,otp,password,passwordConfirm} =req.body
    console.log('resetPassword body:', req.body);
    const user = await User.findOne({email,resetPasswordOTP:String(otp),resetPasswordOTPExpires:{$gt:Date.now()}})
    if(!user){
        return next(new appError("No User found",404))
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.resetPasswordOTP=undefined;
    user.resetPasswordOTPExpires=undefined;

    await user.save()
    createSendToken(user, 200, res, "Password Reset Successfully")

})

exports.changePassword = catchAsync(async(req,res,next)=>{
        const {currentPassword,newPassword,newPasswordConfirm} = req.body
        const {email} = req.user
        const user = await User.findOne({email}).select("+password")

        if(!user){
            return next(new appError("No User found",404))
        }

        if(!(await user.correctPassword(currentPassword,user.password))){
            return next(new appError("Incorrect Password",401))
        }

        if(newPassword !== newPasswordConfirm){
            return next(new appError( "New Passwords are not the same",400))
        }
        user.password = newPassword;
        user.passwordConfirm = newPasswordConfirm;

        await user.save()

        createSendToken(user, 200, res, "Password Changed Successfully")

})
