// auth.js
const express = require("express");
const ROLES = require("../models/roles");
const studentController = require("../controllers/student-controller");
const studentValidation = require("../middlewares/validators/student-validator");
const roleBasedAccess = require("../middlewares/rbac/index");

const router = express.Router();

router.get(
    "/getStudentCurrentStandards",
    studentValidation.getStudentCurrentStandards,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    studentController.getStudentCurrentStandards
);

router.get(
    "/getStudentVideo",
    studentValidation.getStudentVideo,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    studentController.getStudentVideo
);

router.post(
    "/storeStudentVideo",
    studentValidation.storeStudentVideo,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    studentController.storeStudentVideo
);

router.get(
    "/getStudentStandard",
    studentValidation.getStudentStandard,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    studentController.getStudentStandard
);

router.post(
    "/UpdateStudentVideoCompleted",
    studentValidation.UpdateStudentVideoCompleted,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    studentController.UpdateStudentVideoCompleted
);

router.post(
    "/UpdateStudentVideoLastSeenTime",
    studentValidation.UpdateStudentVideoLastSeenTime,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    studentController.UpdateStudentVideoLastSeenTime
);

router.post(
    "/SaveOrRemoveVideo",
    studentValidation.SaveOrRemoveVideo,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    studentController.SaveOrRemoveVideo
);

router.get(
    "/getSavedVideos",
    studentValidation.getSavedVideos,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    studentController.getSavedVideos
);

module.exports = router;
