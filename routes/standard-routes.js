const express = require("express");
const standardValidation = require("../middlewares/validators/standard-validator");
const standardController = require("../controllers/standard-controller");
const roleBasedAccess = require("../middlewares/rbac/index")
const ROLES = require("../models/roles/index");

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
    "/deleteStandard",
    standardValidation.deleteStandard,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    standardController.deleteStandard
);

router.get(
    "/getSummarizedStandard",
    standardValidation.getSummarizedStandard,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    standardController.getSummarizedStandard
);

router.get(
    "/getStandardTopics",
    standardValidation.getStandardTopics,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    standardController.getStandardTopics
);

router.get(
    "/getTopicResources",
    standardValidation.getTopicResources,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    standardController.getTopicResources
);

router.get(
    "/getStandardClassroomsAndTeacherClassrooms",
    standardValidation.getStandardClassroomsAndTeacherClassrooms,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    standardController.getStandardClassroomsAndTeacherClassrooms
);

module.exports = router;
