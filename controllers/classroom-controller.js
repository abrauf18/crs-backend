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

module.exports = {
    createClassroom,
    getClassroom,
};
