const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authMiddleware.UserShouldNotPreExist, authController.signup);
router.post("/login", authMiddleware.UserShouldPreExist, authMiddleware.VerifyPassword, authController.login);
router.post("/register-school", authMiddleware.decodeLoginSignupCookie, authMiddleware.setUserUsingEmail, authController.createSchoolProfile);
router.post("/invite-teachers", authMiddleware.decodeLoginSignupCookie, authMiddleware.setUserUsingEmail, authMiddleware.setSchoolUsingUserID, authController.sendInviteToTeacher);
router.post("/forgot-password", authMiddleware.destructureBody, authMiddleware.setUserUsingEmail, authController.sendOTP);
router.post("/verify-otp", authMiddleware.decodeForgotPasswordCookie, authMiddleware.setUserUsingEmail, authController.verifyOTP);
router.post("/reset-password", authMiddleware.decodeForgotPasswordCookie, authMiddleware.setUserUsingEmail, authController.resetPassword);

module.exports = router;
