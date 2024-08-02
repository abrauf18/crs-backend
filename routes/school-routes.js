// auth.js
const express = require("express");
const ROLES = require("../models/roles");
const schoolController = require("../controllers/school-controller");
const stripe = require("../controllers/stripe");
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
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL]),
    schoolController.schoolDashboard
)

router.delete(
    "/delete-teacher",
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL]),
    schoolController.deleteTeacher
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
router.get('/get-teacher',
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.SCHOOL]),
    schoolController.getTeacher
);
router.get(
    '/get-courses',
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL]),
    schoolController.getSchoolCourses
);
router.get(
    '/get-courses-content',
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL]),
    schoolController.getResourceDetail
);
router.get(
    '/get-resource-result',
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL]),
    schoolController.getResourceResult
);

router.get(
    '/get-resource-result',
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL]),
    schoolController.getAllTeacher
);

router.post("/place-order", stripe.stripeRedirection);
router.post("/webhook", stripe.stripeNotification);







module.exports = router;
