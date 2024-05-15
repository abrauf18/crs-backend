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

router.put(
    "/updateStandard",
    standardValidation.updateStandard,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    standardController.updateStandard
);

router.get(
    "/getStandard",
    standardValidation.getStandard,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    standardController.getStandard
);

router.get(
    "/getAllSummarizedStandards",
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    standardController.getAllSummarizedStandards
);

router.delete(
    "/deleteStandards",
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    standardController.deleteStandards
);

router.get(
    "/getSummarizedStandard",
    standardValidation.getSummarizedStandard,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    standardController.getSummarizedStandard
);

module.exports = router;
