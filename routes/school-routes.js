// auth.js
const express = require("express");
const ROLES = require("../models/roles");
const schoolController = require("../controllers/school-controller");
const schoolValidation = require("../middlewares/validators/school-validator");
const sharedValidator = require("../middlewares/validators/shared/index");
const roleBasedAccess = require("../middlewares/rbac/index");

const router = express.Router();
router.post(
    "/create-school/:token",
    schoolValidation.createSchool,
    schoolController.createSchool
)
router.get(
    "/getAllSchools",
    schoolValidation.getAllSchools,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    schoolController.getAllSchools
)

router.get(
    "/get-school-dashboard",
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.SCHOOL]),
    schoolController.schoolDashboard
)

router.post('/create-ticket', schoolController.createTicket);
router.put('/update-ticket', schoolController.updateTicket);
router.delete('/delete-ticket', schoolController.deleteTicket);
router.get('/get-ticket', schoolController.getTicketById);
router.get('/list-ticket', schoolController.listTickets);


router.get(
    '/list-teacher', 
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL]),
    schoolController.listTeacher
);
router.get('/get-teacher', schoolController.getTeacher);
router.get('/get-courses', schoolController.getSchoolCourses);
router.get('/get-courses-content', schoolController.getResourceDetail);





module.exports = router;
