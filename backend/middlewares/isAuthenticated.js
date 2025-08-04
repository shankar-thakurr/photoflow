const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');
const User = require('../models/userModel');

const isAuthenticated = catchAsync(async (req, res, next) => {
  const token =
    req.cookies.token || req.headers.authorization?.split(" ")[1];
    if(!token){
        return next(
          new appError("You are not logged in! please log in to access.", 401)
        );
    }
    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    const currrentUser = await User.findById(decoded.id)
    
    if(!currrentUser){
        return next(
          new appError("The user belonging to this token does no longer exist.", 401)
        );
    }
    req.user = currrentUser;
    next();
});

module.exports = isAuthenticated;
