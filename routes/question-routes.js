const express = require("express");
const questionValidation = require("../middlewares/validators/question-validator");
const questionController = require("../controllers/question-controller");
const roleBasedAccess = require("../middlewares/rbac/index")
const ROLES = require("../models/roles/index")

const router = express.Router();

router.post(
    "/createVideoQuestions",
    questionValidation.createVideoQuestions,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    questionController.createVideoQuestions
);

router.get(
    "/getVideoQuestions",
    questionValidation.getVideoQuestions,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    questionController.getVideoQuestions
);


module.exports = router;
