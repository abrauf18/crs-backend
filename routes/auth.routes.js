const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authMiddleware.UserShouldNotPreExist, authController.signup);
router.post("/login", authMiddleware.UserShouldPreExist, authMiddleware.VerifyPassword, authController.login);
router.post("/register-school", authMiddleware.decodeAuthToken, authController.createSchoolProfile);
router.post("/invite-teachers", authController.sendInviteToTeacher);
router.post("/forgot-password", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
