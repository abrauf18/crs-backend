const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authMiddleware.signupSchema, authMiddleware.UserShouldNotPreExist, authController.signup);
router.post("/login", authMiddleware.loginSchema, authMiddleware.UserShouldPreExist, authMiddleware.VerifyPassword, authController.login);
router.post("/register-school", authMiddleware.registerSchoolSchema, authMiddleware.decodeAuthCookie, authMiddleware.setUserUsingEmail, authController.createSchoolProfile);
router.post("/invite-teachers", authMiddleware.inviteTeacherSchema, authMiddleware.decodeAuthCookie, authMiddleware.setUserUsingEmail, authMiddleware.setSchoolUsingUserID, authController.sendInviteToTeacher);
router.post("/forgot-password", authMiddleware.forgotPasswordSchema, authMiddleware.getEmailFromBody, authMiddleware.setUserUsingEmail, authController.sendOTP);
router.post("/verify-otp/:userId/:OTP", authController.verifyOTP);
router.post("/reset-password", authMiddleware.resetPasswordSchema, authController.resetPassword);
router.post("/logout", authController.logout);

module.exports = router;
