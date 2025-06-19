const questionService = require("../services/question-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")

const createVideoQuestions = async (req, res) => {
    try {
        const { videoId, questions } = req.body;

        const reply = await questionService.createVideoQuestions({ videoId, questions });

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

const getVideoQuestions = async (req, res) => {
    try {
        const { videoid } = req.headers;

        const reply = await questionService.getVideoQuestions({ videoId: videoid });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        } 
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, reply.message);
        }
        else {
            return handleInternalServerError(res);
        }
    } catch (error) {
        return handleInternalServerError(res);
    }
};

module.exports = {
    createVideoQuestions,
    getVideoQuestions,
};
