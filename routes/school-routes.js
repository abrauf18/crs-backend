// auth.js
const express = require("express");
const ROLES = require("../models/roles");
const schoolController = require("../controllers/school-controller");
const schoolValidation = require("../middlewares/validators/school-validator");
const sharedValidator = require("../middlewares/validators/shared/index");
const roleBasedAccess = require("../middlewares/rbac/index");

const router = express.Router();
router.post(
    "/create-school", 
    schoolController.createSchool
)

router.get(
    "/get-school-dashboard", 
    schoolController.schoolDashboard
)

module.exports = router;
