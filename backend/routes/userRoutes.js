const express = require("express");
const { signup, verifyAccount, resendOtp, login, logout, forgotPassword, resetPassword, changePassword,  } = require("../controllers/AuthController");
const isAuthenticated = require("../middlewares/IsAuthenticated");
const router = express.Router();

router.post("/signup", signup);
router.post('/verify',isAuthenticated, verifyAccount)
router.post('/resend-otp',isAuthenticated, resendOtp)
router.post('/login', login)
router.post('/logout',logout)
router.post('/forgot-password',forgotPassword)
router.post('/reset-password',resetPassword)
router.post('/change-password',isAuthenticated,changePassword)


module.exports = router;
