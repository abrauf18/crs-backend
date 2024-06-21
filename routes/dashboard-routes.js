const express = require("express");
const dashboardValidation = require("../middlewares/validators/dashboard-validator");
const dashboardController = require("../controllers/dashboard-controller");
const roleBasedAccess = require("../middlewares/rbac/index")
const ROLES = require("../models/roles/index")

const router = express.Router();

router.get(
    "/getTeacherDashboardSummaries",
    dashboardValidation.getTeacherDashboardSummaries,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    dashboardController.getTeacherDashboardSummaries
)

router.get(
    "/getAdminDashboardSummaries",
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    dashboardController.getAdminDashboardSummaries
)

router.get(
    "/getStudentDashboardSummaries",
    dashboardValidation.getStudentDashboardSummaries,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    dashboardController.getStudentDashboardSummaries
)

module.exports = router;
