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
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL]),
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

router.get(
    "/getSummarizedClassroomsOfTeacher",
    classroomValidation.getSummarizedClassroomsOfTeacher,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    classroomController.getSummarizedClassroomsOfTeacher
)

router.get(
    "/getClassesAndCourses",
    classroomValidation.getClassesAndCourses,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    classroomController.getClassesAndCourses
)

router.delete(
    "/deleteClassCourse",
    classroomValidation.deleteClassCourse,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    classroomController.deleteClassCourse
)

router.get(
    "/getClassroomStudents",
    classroomValidation.getClassroomStudents,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    classroomController.getClassroomStudents
)

router.post(
    "/addStudentToClassroom",
    classroomValidation.addStudentToClassroom,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    classroomController.addStudentToClassroom
)

router.delete(
    "/removeStudentFromClassroom",
    classroomValidation.removeStudentFromClassroom,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    classroomController.removeStudentFromClassroom
)

router.put(
    "/updateClassroomStudent",
    classroomValidation.updateClassroomStudent,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    classroomController.updateClassroomStudent
)
router.put(
    "/updateTeacherClassrooms",
    classroomValidation.updateTeacherClassrooms,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL]),
    classroomController.updateTeacherClassrooms
)

router.post(
    "/changeClassStatus",
    classroomValidation.changeClassStatus,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL]),
    classroomController.changeClassStatus
)

router.get(
    "/getSchoolClassrooms",
    classroomValidation.getSchoolClassrooms,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.SCHOOL]),
    classroomController.getSchoolClassrooms
)

module.exports = router;
