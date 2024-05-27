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

const getStandardResources = async (req, res) => {
    try {
        const { standardid } = req.headers;
        const reply = await studentService.getStandardResources({ standardId: standardid });

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

const getStudentVideo = async (req, res) => {
    try {
        const { videoid } = req.headers;
        const reply = await studentService.getStudentVideo({ videoId: videoid, studentId: req.user.id});

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
        const { videoId, last_seen_time } = req.body;
        const reply = await studentService.storeStudentVideo({ videoId, studentId: req.user.id, last_seen_time });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200);
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

module.exports = {
    getStudentCurrentStandards,
    getStandardResources,
    getStudentVideo,
    storeStudentVideo,
};
