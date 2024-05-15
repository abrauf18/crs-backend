const express = require("express");
const classroomValidation = require("../middlewares/validators/classroom-validator");
const classroomController = require("../controllers/classroom-controller");
const roleBasedAccess = require("../middlewares/rbac/index")
const ROLES = require("../models/roles/index")

const router = express.Router();

router.post(
    "/createClassroom",
    classroomValidation.createClassroom,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    classroomController.createClassroom
);

router.get(
    "/getClassroom",
    classroomValidation.getClassroom,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    classroomController.getClassroom
);

router.get(
    "/getAllClassroomsOfTeacher",
    classroomValidation.getAllClassroomsOfTeacher,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    classroomController.getAllClassroomsOfTeacher
)

router.post(
    "/assignStandardToClassrooms",
    classroomValidation.assignStandardToClassroom,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    classroomController.assignStandardToClassrooms
)

module.exports = router;
