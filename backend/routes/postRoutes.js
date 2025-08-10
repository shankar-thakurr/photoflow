const express = require('express');
const isAuthenticated = require('../middlewares/IsAuthenticated');
const upload = require('../middlewares/multer');
const { createPost, getUserPosts, saveOrUnsavePost, deletePost ,likeOrUnlikePost , getAllPosts ,addComment} = require('../controllers/postController');

const router =express.Router();

// define routes
router.post('/create-post',isAuthenticated,upload.single("image"),createPost)
router.get('/all-posts',getAllPosts)
router.get('/user-posts/:id',getUserPosts)
router.post('/save-unsave-post/:postId', isAuthenticated,saveOrUnsavePost)
router.delete('/delete-post/:id',isAuthenticated,deletePost)
router.post('/like-unlike-post/:id',isAuthenticated,likeOrUnlikePost)
router.post('/add-comment/:id',isAuthenticated,addComment)




module.exports = router;