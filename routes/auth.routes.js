// auth.js
const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/register-school", authController.createSchoolProfile);
router.post("/invite-teachers", authController.sendInviteToTeacher);

module.exports = router;
