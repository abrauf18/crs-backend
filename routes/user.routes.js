// auth.js
const express = require("express");
const userController = require("../controllers/userController");
const userValidation = require("../middlewares/bodyValidators/user");
const sharedValidator = require("../middlewares/bodyValidators/shared/index");
const roleBasedAccess = require("../middlewares/roleBasedAccessControllers/index");

const router = express.Router();
router.get("/getUserProfile", sharedValidator.verifyHeaderAccessToken, roleBasedAccess.setUser, userController.getUserProfile)
router.post("/updateUserProfile", userValidation.updateUserProfile, roleBasedAccess.setUser, userController.updateUserProfile)

module.exports = router;
