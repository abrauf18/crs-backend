// auth.js
const express = require("express");
const ROLES = require("../models/roles");
const schoolController = require("../controllers/school-controller");
const schoolValidation = require("../middlewares/validators/school-validator");
const sharedValidator = require("../middlewares/validators/shared/index");
const roleBasedAccess = require("../middlewares/rbac/index");

const router = express.Router();
router.post(
    "/create-school", 
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
    schoolController.schoolDashboard
)

router.post('/create-ticket', schoolController.createTicket);
router.put('/update-ticket', schoolController.updateTicket);
router.delete('/delete-ticket', schoolController.deleteTicket);
router.get('/get-ticket', schoolController.getTicketById);
router.get('/list-ticket', schoolController.listTickets);


module.exports = router;
