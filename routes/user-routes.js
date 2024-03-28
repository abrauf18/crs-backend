// auth.js
const express = require("express");
const userController = require("../controllers/user-controller");
const userValidation = require("../middlewares/validators/user-validator");
const sharedValidator = require("../middlewares/validators/shared/index");
const roleBasedAccess = require("../middlewares/rbac/index");

const router = express.Router();
router.get("/getUserProfile", sharedValidator.verifyHeaderAccessToken, roleBasedAccess.setUser, userController.getUserProfile)
router.post("/updateUserProfile", userValidation.updateUserProfile, roleBasedAccess.setUser, userController.updateUserProfile)

module.exports = router;
