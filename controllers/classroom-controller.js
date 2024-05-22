const classroomService = require("../services/classroom-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")

const createClassroom = async (req, res) => {
    try {
        const { name, teacherId } = req.body;
        const reply = await classroomService.createClassroom({ name, teacherId });

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
        const { classroomIds, standardId } = req.body;
        const reply = await classroomService.assignStandardToClassrooms({ classroomIds, standardId });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 400) {
            return handleErrorResponse(res, 400, "Duplicate classrooms are not allowed.");
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 400, reply.message);
        }
        else if (reply.code == 405) {
            return handleErrorResponse(res, 404, "Standard not found");
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
            return handleErrorResponse(res, 404, 'Relation between standard and class Not found');
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
        const { classroomid, page, limit } = req.headers;
        const reply = await classroomService.getClassroomStudents({ classroomId: classroomid, page, limit });

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

const addStudentToClassroom = async (req, res) => {
    try {
        const { classroomId, studentId } = req.body;
        const reply = await classroomService.addStudentToClassroom({ classroomId, studentId });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, 'Classroom not found');
        }
        else if (reply.code == 405) {
            return handleErrorResponse(res, 404, 'Student not found');
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
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
            return handleErrorResponse(res, 404, 'Relation between student and class not found');
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
    removeStudentFromClassroom
};
