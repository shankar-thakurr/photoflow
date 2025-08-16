const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const { uploadToCloudinary } = require("../utils/cloudinary");
const getDataUri = require("../utils/dataUri");
const appError = require("../utils/appError");

exports.getProfile = catchAsync(async (req, res, next) => {
    const {id} = req.params;
    
    const user =  await User.findById(id).select("-password -otp -otpExpires -resetPasswordOTP -resetPasswordOTPExpires -passwordConfirm").populate({
        path:"posts",
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
        const fileUri = getDataUri(req.file);
        if (fileUri) {
            const myCloud = await uploadToCloudinary(fileUri);
            if (myCloud && myCloud.secure_url) {
                user.profilePicture = myCloud.secure_url;
            } else {
                return next(new appError("Failed to upload profile picture. Please try again.", 500));
            }
        }
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
    const targetUserId = req.params.id;

    if(loginUserId.toString() === targetUserId){
        return next(new appError("You can't follow/unfollow yourself",400))
    }

    const targetUser = await User.findById(targetUserId);

    if(!targetUser){
        return next(new appError("User not found",404))
    }

    const isFollowing = targetUser.followers.includes(loginUserId);

    if(isFollowing){
        // Unfollow
        await Promise.all([
            User.updateOne({ _id: loginUserId }, { $pull: { followings: targetUserId } }),
            User.updateOne({ _id: targetUserId }, { $pull: { followers: loginUserId } })
        ])
    }else{
        // Follow
        await Promise.all([
            User.updateOne({ _id: loginUserId }, { $addToSet : { followings: targetUserId } }),
            User.updateOne({ _id: targetUserId }, { $addToSet : { followers: loginUserId } })
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

exports.saveUnsavePost = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const postId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
        return next(new appError("User not found", 404));
    }

    const isPostSaved = user.savedPosts.includes(postId);

    if (isPostSaved) {
        // Unsave the post
        await User.updateOne({ _id: userId }, { $pull: { savedPosts: postId } });
        res.status(200).json({
            status: "success",
            message: "Post unsaved successfully",
        });
    } else {
        // Save the post
        await User.updateOne({ _id: userId }, { $addToSet: { savedPosts: postId } });
        res.status(200).json({
            status: "success",
            message: "Post saved successfully",
        });
    }
});
