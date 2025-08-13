const express = require("express");
const { signup, verifyAccount, resendOtp, login, logout, forgotPassword, resetPassword, changePassword,  } = require("../controllers/AuthController");
const isAuthenticated = require("../middlewares/IsAuthenticated");
const { getProfile, editProfile, suggestedUser, followUnfollow, getMe } = require("../controllers/userController");
const upload = require("../middlewares/multer");
const router = express.Router();

// auth 
router.post("/signup", signup);
router.post('/verify',isAuthenticated, verifyAccount)
router.post('/resend-otp',isAuthenticated, resendOtp)
router.post('/login', login)
router.post('/logout',logout)
router.post('/forgot-password',forgotPassword)
router.post('/reset-password',resetPassword)
router.post('/change-password',isAuthenticated,changePassword)


// User

router.get('/profile/:id',getProfile)
router.post('/edit-profile',isAuthenticated, upload.single("profilePicture"),editProfile)
router.get('/suggested-users',isAuthenticated,suggestedUser)
router.post('/follow-unfollow/:id',isAuthenticated,followUnfollow)
router.get('/me',isAuthenticated,getMe)


module.exports = router;
