const classroomService = require("../services/classroom-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")

const createClassroom = async (req, res) => {
    try {
        const { name, teacherId, schoolId } = req.body;
        const reply = await classroomService.createClassroom({ name, teacherId, schoolId });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 409) {
            return handleErrorResponse(res, 409, "Classroom with this name already exists");
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

const getClassroom = async (req, res) => {
    try {
        const { classroomid } = req.headers;
        const reply = await classroomService.getClassroom({ classroomId: classroomid });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

const getAllClassroomsOfTeacher = async (req, res) => {
    try {
        const { teacherid } = req.headers;
        const reply = await classroomService.getAllClassroomsOfTeacher({ teacherId: teacherid });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

const assignStandardToClassrooms = async (req, res) => {
    try {
        const { classCourses, standardId } = req.body;
        const reply = await classroomService.assignStandardToClassrooms({ classCourses, standardId });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 400) {
            return handleErrorResponse(res, 400, reply.message);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, reply.message);
        }
        else if (reply.code == 409) {
            return handleErrorResponse(res, 409, reply.message);
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

const getSummarizedClassroomsOfTeacher = async (req, res) => {
    try {
        const { teacherid } = req.headers;
        const reply = await classroomService.getSummarizedClassroomsOfTeacher({ teacherId: teacherid });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

const getClassesAndCourses = async (req, res) => {
    try {
        const { teacherid } = req.headers;
        const reply = await classroomService.getClassesAndCourses({ teacherId: teacherid });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
}

const deleteClassCourse = async (req, res) => {
    try {
        const { classroomcourseid } = req.headers;
        const reply = await classroomService.deleteClassCourse({ classroomCourseId: classroomcourseid });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        if (reply.code == 404) {
            return handleErrorResponse(res, 404, reply.message);
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
}

const getClassroomStudents = async (req, res) => {
    try {
        const { classroomid, page = 1, limit = 10 } = req.headers;
        const reply = await classroomService.getClassroomStudents({ classroomId: classroomid, page, limit });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, reply.message);
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
}

const addStudentToClassroom = async (req, res) => {
    try {
        const { classroomId, email } = req.body;
        const { school_id: schoolId } = req.user;
        const reply = await classroomService.addStudentToClassroom({ classroomId, email, schoolId });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 400) {
            return handleErrorResponse(res, 400, reply.message);
        }
        else if (reply.code == 403) {
            return handleErrorResponse(res, 403, reply.message);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, 'Classroom not found');
        }
        else if (reply.code == 405) {
            return handleErrorResponse(res, 404, 'Student not found');
        }
        else if (reply.code == 409) {
            return handleErrorResponse(res, 409, reply.message);
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        console.log('\n\n\n\n', error)
        return handleInternalServerError(res);
    }
}

const removeStudentFromClassroom = async (req, res) => {
    try {
        const { classroomstudentid } = req.headers;
        const reply = await classroomService.removeStudentFromClassroom({ classroomStudentId: classroomstudentid });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, reply.message);
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
}

const updateClassroomStudent = async (req, res) => {
    try {
        const { studentId, name, email, classroomId, image } = req.body;
        const reply = await classroomService.updateClassroomStudent({ studentId, name, email, classroomId, image });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 400) {
            return handleErrorResponse(res, 400, 'User with this email already exists');
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, reply.message);
        }
        else if (reply.code == 409) {
            return handleErrorResponse(res, 409, 'Student already exists in the classroom');
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
}


const updateTeacherClassrooms = async (req, res) => {
    try {
        const { schoolId, teacherId, classroomIds } = req.body;
        const reply = await classroomService.updateTeacherClassrooms({ schoolId, teacherId, classroomIds });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, reply.message);
        }
        else if (reply.code == 409) {
            return handleErrorResponse(res, 409, reply.message);
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
}

const changeClassStatus = async (req, res) => {
    try {
        const { schoolId, classroomId, status } = req.body;
        const reply = await classroomService.changeClassStatus({ schoolId, classroomId, status });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 400) {
            return handleErrorResponse(res, 400, reply.message);
        }
        else if (reply.code == 403) {
            return handleErrorResponse(res, 403, reply.message);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, reply.message);
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
}

const getSchoolClassrooms = async (req, res) => {
    try {
        const { schoolid, page=1, limit=10 } = req.headers;
        const reply = await classroomService.getSchoolClassrooms({ schoolId: schoolid, page, limit });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, reply.message);
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
}

module.exports = {
    createClassroom,
    getClassroom,
    getAllClassroomsOfTeacher,
    assignStandardToClassrooms,
    getSummarizedClassroomsOfTeacher,
    getClassesAndCourses,
    deleteClassCourse,
    getClassroomStudents,
    addStudentToClassroom,
    removeStudentFromClassroom,
    updateClassroomStudent,
    updateTeacherClassrooms,
    changeClassStatus,
    getSchoolClassrooms
};
