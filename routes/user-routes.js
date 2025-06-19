const express = require("express");
const ROLES = require("../models/roles");
const userController = require("../controllers/user-controller");
const userValidation = require("../middlewares/validators/user-validator");
const sharedValidator = require("../middlewares/validators/shared/index");
const roleBasedAccess = require("../middlewares/rbac/index");

const router = express.Router();

router.get(
    "/getUserProfile",
    sharedValidator.verifyHeaderAccessToken,
    roleBasedAccess.setUser,
    userController.getUserProfile
);

router.post(
    "/updateUserProfile",
    userValidation.updateUserProfile,
    roleBasedAccess.setUser,
    userController.updateUserProfile
);

router.get(
    "/getAllUsersProfile",
    sharedValidator.verifyHeaderAccessToken,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    userValidation.getAllUsersProfile,
    userController.getAllUsersProfile
);

router.post(
    "/updateAnotherUsersProfile",
    userValidation.updateAnotherUsersProfile,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    userController.updateAnotherUsersProfile
);

router.delete(
    "/deleteAnotherUsersProfile",
    userValidation.deleteAnotherUsersProfile,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    userController.deleteAnotherUsersProfile
);

router.get(
    "/getAllTeachers",
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.SCHOOL]),
    userController.getAllTeachers
)

module.exports = router;
