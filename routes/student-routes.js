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

router.get(
    "/getStandardsResourcesAndCount",
    studentValidation.getStandardsResourcesAndCount,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    studentController.getStandardsResourcesAndCount
);

router.get(
    "/getStudentProfileStandardResults",
    studentValidation.getStudentProfileStandardResults,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    studentController.getStudentProfileStandardResults
);

router.get(
    "/getStudentProfileSummarizedStandards",
    studentValidation.getStudentProfileSummarizedStandards,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    studentController.getStudentProfileSummarizedStandards
)

router.get(
    "/getSummarizedStudentStandardsForTeacher",
    studentValidation.getSummarizedStudentStandardsForTeacher,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    studentController.getSummarizedStudentStandardsForTeacher
)

router.get(
    "/getSummarizedStudentForTeacher",
    studentValidation.getSummarizedStudentForTeacher,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    studentController.getSummarizedStudentForTeacher
)

router.get(
    "/getStudentNameEmailForTeacher",
    studentValidation.getStudentNameEmailForTeacher,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    studentController.getStudentNameEmailForTeacher
)

router.post(
    "/assignMarksToStudentAnswer",
    studentValidation.assignMarksToStudentAnswer,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    studentController.assignMarksToStudentAnswer
)

router.get(
    "/getStudentAssessmentAnswer",
    studentValidation.getStudentAssessmentAnswer,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    studentController.getStudentAssessmentAnswer
)

router.get(
    "/getAllSummarizedStudentAndStandardsForTeacher",
    studentValidation.getAllSummarizedStudentAndStandardsForTeacher,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    studentController.getAllSummarizedStudentAndStandardsForTeacher
)

module.exports = router;
