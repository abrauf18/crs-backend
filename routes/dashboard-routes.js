const express = require("express");
const dashboardValidation = require("../middlewares/validators/dashboard-validator");
const dashboardController = require("../controllers/dashboard-controller");
const roleBasedAccess = require("../middlewares/rbac/index")
const ROLES = require("../models/roles/index")

const router = express.Router();

router.get(
    "/getTeacherDashboardClassroomsOverview",
    dashboardValidation.getTeacherDashboardClassroomsOverview,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    dashboardController.getTeacherDashboardClassroomsOverview
)

router.get(
    "/getTeacherDashboardStandardsOverview",
    dashboardValidation.getTeacherDashboardStandardsOverview,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    dashboardController.getTeacherDashboardStandardsOverview
)

router.delete(
    "/deleteClassCourse",
    dashboardValidation.deleteClassroom,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    dashboardController.deleteClassCourse
)

module.exports = router;
