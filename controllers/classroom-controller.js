const classroomService = require("../services/classroom-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")

const createClassroom = async (req, res) => {
    try {
        const { name, teacherId } = req.body;
        const reply = await classroomService.createClassroom({name, teacherId});

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
        const reply = await classroomService.getClassroom({classroomId: classroomid});

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
        const reply = await classroomService.assignStandardToClassrooms({classroomIds, standardId});

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, reply.message);
        }
        else if (reply.code == 409) {
            return handleErrorResponse(res, 404, "Standard not found");
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

module.exports = {
    createClassroom,
    getClassroom,
    getAllClassroomsOfTeacher,
    assignStandardToClassrooms
};
