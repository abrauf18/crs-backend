const express = require("express");
const assessmentAnswerValidation = require("../middlewares/validators/assessmentAnswer-validator");
const assessmentAnswerController = require("../controllers/assessmentAnswer-controller");
const roleBasedAccess = require("../middlewares/rbac/index")
const ROLES = require("../models/roles/index")

const router = express.Router();

router.post(
    "/createAssessmentAnswer",
    assessmentAnswerValidation.createAssessmentAnswer,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL, ROLES.TEACHER]),
    assessmentAnswerController.createAssessmentAnswer
);

router.get(
    "/getAssessmentAnswer",
    assessmentAnswerValidation.getAssessmentAnswer,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL, ROLES.TEACHER]),
    assessmentAnswerController.getAssessmentAnswer
);

router.get(
    "/getAssessmentAnswerToCreateOrEdit",
    assessmentAnswerValidation.getAssessmentAnswerToCreateOrEdit,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL, ROLES.TEACHER]),
    assessmentAnswerController.getAssessmentAnswerToCreateOrEdit
);


module.exports = router;
