const express = require("express");
const classroomValidation = require("../middlewares/validators/classroom-validator");
const classroomController = require("../controllers/classroom-controller");
const roleBasedAccess = require("../middlewares/rbac/index")
const ROLES = require("../models/roles/index")

const router = express.Router();

router.post(
    "/createClassroom",
    // classroomValidation.createClassroom,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    classroomController.createClassroom
);

router.get(
    "/getClassroom",
    // classroomValidation.getClassroom,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    classroomController.getClassroom
);

module.exports = router;
