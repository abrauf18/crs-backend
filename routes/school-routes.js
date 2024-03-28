// auth.js
const express = require("express");
const ROLES = require("../models/roles");
const schoolController = require("../controllers/school-controller");
const schoolValidation = require("../middlewares/validators/school-validator");
const sharedValidator = require("../middlewares/validators/shared/index");
const roleBasedAccess = require("../middlewares/rbac/index");

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
