const videoQuestionAnswerService = require("../services/videoQuestionAnswer-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")

const createVideoQuestionAnswer = async (req, res) => {
    try {
        const { userId, questionId, answer } = req.body;

        const reply = await videoQuestionAnswerService.createVideoQuestionAnswer(userId, questionId, answer);

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
    createVideoQuestionAnswer,
};
