const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const { uploadToCloudinary } = require("../utils/cloudinary");
const getDataUri = require("../utils/dataUri");

exports.getProfile = catchAsync(async (req, res, next) => {
    const {id} = req.params;
    
    const user =  await User.findById(id).select("-password -otp -otpExpires -resetPasswordOTP -resetPasswordOTPExpires -passwordConfirm").populate({
        path:"post",
        options:{sort:{createdAt:-1}}
    }).populate({
        path:"savedPosts",
        options:{sort:{createdAt:-1}}
    });

    if(!user){
        return next(new appError("User not found",404))
    }
    res.status(200).json({
        status:"success",
        data: {
            user,
        }
    })
});

exports.editProfile = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { bio } = req.body;

    const user = await User.findById(userId).select('-password');

    if (!user) {
        return next(new appError("User not found in database", 404));
    }

    if (bio) {
        user.bio = bio;
    }

    if (req.file) {
        const profilePicture = req.file.path;
        const fileUrl = await getDataUri(profilePicture);
        const cloudRessponse = await uploadToCloudinary(fileUrl);
        user.profilePicture = cloudRessponse.secure_url;
    }

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
        message: "Profile updated successfully",
        status: "success",
        data: {
            user,
        }
    });
});

exports.suggestedUser = catchAsync(async (req, res, next) => {
    const loginUserId = req.user.id;

    const users = await User.find({ _id: { $ne: loginUserId }} ).select("-password -otp -otpExpires -resetPasswordOTP -resetPasswordOTPExpires -passwordConfirm");

    res.status(200).json({
        status: "success",
        data: {
            users,
        }
    });
});

exports.followUnfollow = catchAsync(async (req, res, next) => {
    const loginUserId = req.user.id;
    const tragetUserId = req.params.id;

    if(loginUserId.toString() === tragetUserId){
        return next(new appError("You can't follow/unfollow yourself",400))
    }

    const tragetUser = await User.findById(tragetUserId);

    if(!tragetUser){
        return next(new appError("User not found",404))
    }

    const isFollowing = tragetUser.follwers.includes(loginUserId);

    if(!isFollowing){
        await Promise.all([
            User.updateOne({ _id: loginUserId }, { $pull: { follwering: tragetUserId } }),

            User.updateOne({ _id: tragetUserId }, { $pull: { follwers: loginUserId } })
        ])
    }else{
        await Promise.all([
            User.updateOne({ _id: loginUserId }, { $addToSet : { follwering: tragetUserId } }),

            User.updateOne({ _id: tragetUserId }, { $addToSet : { follwers: loginUserId } })
        ])
    }

    const updatedLoginUser = await User.findById(loginUserId).select(' -password')

    res.status(200).json({
        message: isFollowing ? "Unfollowed successfully" : "Followed successfully",
        status: "success",
        data: {
            user: updatedLoginUser,
        }
    });
})

exports.getMe = catchAsync(async (req, res, next) => {
    const user = req.user;

    if(!user){
        return next(new appError("User not Authenticated",404))
    }
    res.status(200).json({
        status: "success",
        message: "Authenticated User",
        data: {
            user,
        }
    });

});  