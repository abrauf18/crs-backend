const videoQuestionAnswerService = require("../services/videoQuestionAnswer-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")

const createVideoQuestionAnswer = async (req, res) => {
    try {
        const { userId, questionId, answer, standardId } = req.body;
        console.log('\n\n\n', userId, questionId, answer, standardId);

        const reply = await videoQuestionAnswerService.createVideoQuestionAnswer({userId, questionId, answer, standardId});

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        } 
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, 'Question not found');
        } 
        else if (reply.code == 409) {
            return handleErrorResponse(res, 409, 'User has already answered this question');
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
