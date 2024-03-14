// auth.js
const express = require("express");
const ROLES = require("../models/Roles");
const schoolController = require("../controllers/schoolController");
const schoolValidation = require("../middlewares/bodyValidators/school");
const sharedValidator = require("../middlewares/bodyValidators/shared/index");
const roleBasedAccess = require("../middlewares/roleBasedAccessControllers/index");

const router = express.Router();
router.get(
    "/getSchoolProfile", 
    sharedValidator.verifyHeaderAccessToken, 
    roleBasedAccess.setUser, 
    roleBasedAccess.VerifyAllowedRole([ROLES.SCHOOL]), 
    schoolController.getSchoolProfile
)
router.post(
    "/updateSchoolAndUserProfile", 
    schoolValidation.updateSchoolAndUserProfile, 
    roleBasedAccess.setUser, 
    roleBasedAccess.VerifyAllowedRole([ROLES.SCHOOL]), 
    schoolController.updateSchoolAndUserProfile
)

module.exports = router;
