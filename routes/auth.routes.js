const express = require("express");
const authValidation = require("../middlewares/auth");
const authController = require("../controllers/authController");

const router = express.Router();

router.post(
    "/signup",
    authValidation.signupSchema,
    authController.signup
);
router.post(
    "/login",
    authValidation.loginSchema,
    authController.login
);
router.post(
    "/register-school",
    authValidation.registerSchoolSchema,
    authController.createSchoolProfile
);
router.post(
    "/invite-teachers",
    authValidation.inviteTeacherSchema,
    authController.sendInviteToTeacher
);
router.post(
    "/forgot-password",
    authValidation.forgotPasswordSchema,
    authController.sendOTP
);
router.post(
    "/verify-otp/",
    authValidation.verifyOTPSchema,
    authController.verifyOTP
);
router.post(
    "/reset-password",
    authValidation.resetPasswordSchema,
    authController.resetPassword
);
router.post(
    "/logout",
    authController.logout
);

module.exports = router;
