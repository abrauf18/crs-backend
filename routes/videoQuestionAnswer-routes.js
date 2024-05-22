const express = require("express");
const videoQuestionAnswerValidation = require("../middlewares/validators/videoQuestionAnswer-validator");
const videoQuestionAnswerController = require("../controllers/videoQuestionAnswer-controller");
const roleBasedAccess = require("../middlewares/rbac/index")
const ROLES = require("../models/roles/index")

const router = express.Router();

router.post(
    "/createVideoQuestionAnswer",
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL, ROLES.TEACHER, ROLES.STUDENT]),
    videoQuestionAnswerValidation.createVideoQuestionAnswer,
    videoQuestionAnswerController.createVideoQuestionAnswer
);

module.exports = router;