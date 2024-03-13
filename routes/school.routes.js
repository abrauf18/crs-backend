// auth.js
const express = require("express");
const schoolController = require("../controllers/schoolController");
const schoolValidation = require("../middlewares/bodyValidators/school");
const sharedValidator = require("../middlewares/bodyValidators/shared/index");
const roleBasedAccess = require("../middlewares/roleBasedAccessControllers/index")

const router = express.Router();
router.get("/getSchoolProfile", sharedValidator.verifyHeaderAccessToken, roleBasedAccess.setUser, schoolController.getSchoolProfile)
router.post("/updateSchoolProfile", schoolValidation.updateSchoolProfile, roleBasedAccess.setUser, schoolController.updateSchoolProfile)

module.exports = router;
