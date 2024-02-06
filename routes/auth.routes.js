const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authMiddleware.UserShouldNotPreExist, authController.signup);
router.post("/login", authMiddleware.UserShouldPreExist, authMiddleware.VerifyPassword, authController.login);
router.post("/register-school", authMiddleware.decodeAuthAndSetUser, authController.createSchoolProfile);
router.post("/invite-teachers", authMiddleware.decodeAuthAndSetUser, authMiddleware.setSchoolWithDecodedUser, authController.sendInviteToTeacher);
router.post("/forgot-password", authMiddleware.deStructureBodyAndSetUser, authController.sendOTP);
router.post("/verify-otp", authMiddleware.decodeForgotPasswordAuth, authController.verifyOTP);
router.post("/reset-password", authMiddleware.decodeForgotPasswordAuth, authController.resetPassword);

module.exports = router;
