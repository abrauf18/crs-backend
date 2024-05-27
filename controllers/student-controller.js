const studentService = require("../services/student-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")

const getStudentCurrentStandards = async (req, res) => {
    try {
        const { studentid } = req.headers;
        const reply = await studentService.getStudentCurrentStandards({ studentId: studentid });

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
};

const getStudentVideo = async (req, res) => {
    try {
        const { videoid, studentid } = req.headers;
        const reply = await studentService.getStudentVideo({ videoId: videoid, studentId: studentid});

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

const storeStudentVideo = async (req, res) => {
    try {
        const { videoId, last_seen_time, studentId } = req.body;
        const reply = await studentService.storeStudentVideo({ videoId, studentId, last_seen_time });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 400) {
            return handleErrorResponse(res, 400, 'Invalid last_seen_time');
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

const getStudentStandard = async (req, res) => {
    try {
        const { standardid, studentid } = req.headers;
        const reply = await studentService.getStudentStandard({ standardId: standardid, studentId: studentid});

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
    getStudentCurrentStandards,
    getStudentVideo,
    storeStudentVideo,
    getStudentStandard
};
