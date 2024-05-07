const express = require("express");
const standardValidation = require("../middlewares/validators/standard-validator");
const standardController = require("../controllers/standard-controller");
const roleBasedAccess = require("../middlewares/rbac/index")
const ROLES = require("../models/roles/index")

const router = express.Router();

router.post(
    "/createStandard",
    standardValidation.createStandard,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    standardController.createStandard
);

module.exports = router;
