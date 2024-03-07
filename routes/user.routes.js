// auth.js
const express = require("express");
const userValidation = require("../middlewares/bodyValidators/user");
const userController = require("../controllers/userController");
const roleBasedAccess = require("../middlewares/roleBasedAccessControllers/index")

const router = express.Router();
router.get("/getUserProfile", userValidation.getUserProfile, roleBasedAccess.setUser, userController.getUserProfile)
router.post("/updateUserProfile", userValidation.updateUserProfile, roleBasedAccess.setUser, userController.updateUserProfile)

module.exports = router;
