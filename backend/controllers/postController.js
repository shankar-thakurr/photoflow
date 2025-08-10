const catchAsync = require("../utils/catchAsync");
const Post = require("../models/postModel");
const appError = require("../utils/appError");
const sharp = require("sharp");
const { uploadToCloudinary , cloudinary} = require("../utils/cloudinary");
const User = require("../models/userModel");


exports.createPost = catchAsync(async(req,res,next)=>{
    const {caption} = req.body
    const image=req.file
    const useId= req.user._id

    if(!image){
        return next(new appError("Image is required for the post",400))   
    }
    // optimize our image

    const optimizedImageBuffer = await sharp(image.buffer)
    .resize({
        width:800,
        height:800,
        fit:"contain"
    }).toFormat("jpeg",{quality:80}).toBuffer()

    const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString("base64")}`
    
    const cloudRessponse = await uploadToCloudinary(fileUri)

    let post = await Post.create({
        caption,
        image:{
            url:cloudRessponse.secure_url,
            publicId:cloudRessponse.public_id
        },
        user:useId
    });

    // add post to users posts

    const user = await User.findById(useId)

    if(user){
        user.posts.push(post._id)
        await user.save({validateBeforeSave:false})
    }

    post = await post.populate({
        path:'user',
        select:"username email bio profilePicture",
    })
    res.status(201).json({
        status:"success",
        message:"Post created successfully",
        data:{
            post
        }
    })
})

exports.getAllPosts = catchAsync(async(req,res,next)=>{
    const posts = await Post.find().populate({
        path:'user',
        select:"username email bio profilePicture",
    }).populate({
        path:'comments',
        select:'test user', 
        
        populate:{
            path:'user',
            select:"username profilePicture",
        },
    }).sort({createdAt:-1
    })

    res.status(200).json({
        status:"success",
        results:posts.length,
        data:{
            posts
        }
    })
}) // we get some errpr here populate

exports.getUserPosts = catchAsync(async(req,res,next)=>{
    const userId = req.params.id

    const posts = await Post.find({user:userId}).populate({
        path:'user',
        select:"text user",
        populate:{
        path:'comments',
        select:'username profilePicture',
    }
    }).sort({createdAt:-1})

    return res.status(200).json({
        status:"success",
        results:posts.length,
        data:{
            posts
        }
    })
})

exports.saveOrUnsavePost = catchAsync(async(req,res,next)=>{
    const userId = req.user._id
    const postId = req.params.postId;

    const user = await User.findById(userId)

    if(!user){
        return next(new appError("User not found",404))
    }

    const isPostSave = user.savedPosts.includes(postId)

    if(!isPostSave){
      user.savedPosts.pull(postId);
      await user.save({validateBeforeSave:false})

      return res.status(200).json({
        status:"success",
        message:"Post unsaved successfully",
        data:{
            user,
        }
      })
    }else{
        user.savedPosts.push(postId)
        await user.save({validateBeforeSave:false})
        return res.status(200).json({
            status:"success",
            message:"Post saved successfully",
            data:{
                user,
            }
        })
    }
})

exports.deletePost = catchAsync(async(req,res,next)=>{
    const {id} = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id).populate("user")

    if(!post){
        return next(new appError("Post not found",404))
    }
    if(!post.user._id.toString() !== userId.toString()){
        return next(new appError("You are not authorized to delete this post",403))
    }

    // remove the post from user posts

    await User.updateOne({ _id: userId }, { $pull: { posts: id } })

    // remove this post from users save list 

    await User.updateMany({ savedPosts: id }, { $pull: { savedPosts: id } })

    // remove the post from all comments this post has

    await Post.updateMany({ comments: id }, { $pull: { comments: id } })

    // remove the image form cloudinary

    if(post.image.publicId){
        await cloudinary.uploader.destroy(post.image.publicId)
    }

    // remove the post 

    await Post.findByIdAndDelete(id);
    
    res.status(200).json({
        status:"success",
        message:"Post deleted successfully",

    })
})

exports.likeOrUnlikePost = catchAsync(async(req,res,next)=>{
    const userId = req.user._id;
    const postId = req.params.postId;

    const post = await Post.findById(id)
    if(!post){
        return next(new appError("Post not found",404))
    }

    const isLiked = post.likes.includes(userId)

    if(!isLiked){
        await Post.findByIdAndUpdate(id,{$pull:{likes:userId}},{new:true})
        
        return res.status(200).json({   
            status:"success",
            message:"Post disliked successfully",
            data:{
                post,
            }
        })
    }else{
        await Post.findByIdAndUpdate(id,{$addToSet:{likes:userId}},{new:true})
        
        return res.status(200).json({
            status:"success",
            message:"Post liked successfully",
            data:{
                post,
            }
        })
    }  
})

exports.addComment = catchAsync(async(req,res,next)=>{
    const {id:postId} = req.params
    const userId = req.user._id;
    
    const {text} = req.body;

    const post = await Post.findById(postId)

    if(!post){
        return next(new appError("Post not found",404))
    }

     if(!text){
        return next(new appError("Commnet text is required",404))
    }

    const comment = await Comment.create({
        text,
        user:userId,
        createdAtL:Date.now(),
    })
    post.comments.push(comment._id)
    await post.save({validateBeforeSave:false})

    await comment.populate({
        path:'user',
        select:"username profilePicture bio",
        data:{
            comment,
        }
    })

    

})