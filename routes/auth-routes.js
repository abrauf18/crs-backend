const express = require("express");
const authValidation = require("../middlewares/validators/auth-validator");
const authController = require("../controllers/auth-controller");
const roleBasedAccess = require("../middlewares/rbac/index")
const ROLES = require("../models/roles/index")

const router = express.Router();

router.post(
    "/emailBasedInvite",
    authValidation.emailBasedInvite,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL, ROLES.TEACHER]),
    authController.emailBasedInvite
);
router.post(
    "/emailBasedSignup/token/:token",
    authValidation.emailBasedSignup,
    authController.emailBasedSignup
);
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
    roleBasedAccess.oldSetUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL]),
    authController.createSchoolProfile
);
router.post(
    "/invite-teachers",
    authValidation.inviteTeacherSchema,
    roleBasedAccess.oldSetUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL]),
    authController.sendInviteToTeacher
);
router.post(
    "/forgot-password",
    authValidation.forgotPasswordSchema,
    authController.sendOTP
);
router.post(
    "/verify-otp",
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
