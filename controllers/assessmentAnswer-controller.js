const assessmentAnswerService = require("../services/assessmentAnswer-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")

const createAssessmentAnswer = async (req, res) => {
    try {
        const {userId, resourceId, standardId, answerURL} = req.body;

        const reply = await assessmentAnswerService.createAssessmentAnswer({userId, resourceId, standardId, answerURL});

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        } 
        else if (reply.code == 400) {
            return handleErrorResponse(res, 400, reply.message);
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

const getAssessmentAnswer = async (req, res) => {
    try {
        const { assessmentanswerid } = req.headers;
        
        const reply = await assessmentAnswerService.getAssessmentAnswer({ assessmentAnswerId: assessmentanswerid });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, "Student's Assessment Answer not found");
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

const getAssessmentAnswerToCreateOrEdit = async (req, res) => {
    try {
        const { resourceid, userid, standardid } = req.headers;
        
        const reply = await assessmentAnswerService.getAssessmentAnswerToCreateOrEdit({ resourceId: resourceid, userId: userid, standardId: standardid });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, "Student's Assessment Answer not found");
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
    createAssessmentAnswer,
    getAssessmentAnswer,
    getAssessmentAnswerToCreateOrEdit
};
