const Joi = require('joi');
const { logger } = require("../../Logs/logger");
const { RESOURCE_TYPES, RESOURCE_STATUS } = require('../../utils/enumTypes');
const { handleInternalServerError, handleErrorResponse } = require('../../utils/response-handlers');

const createSchemaMiddleware = (schema, target = 'body') => async (req, res, next) => {
    try {
        const { error } = schema.validate(req[target]);
        if (error) {
            return handleErrorResponse(res, 400, error.details[0].message);
        }
        next();
    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        handleInternalServerError(res);
    }
};

const createAssessmentAnswer = createSchemaMiddleware(
    Joi.object({
        userId: Joi.string().guid().required(),
        resourceId: Joi.string().guid().required(),
        standardId: Joi.string().guid().required(),
        answerURL: Joi.string().required(),
        accessToken: Joi.string().required(),
    })
);

const getAssessmentAnswer = createSchemaMiddleware(
    Joi.object({
        assessmentanswerid: Joi.string().guid().required(),
        accesstoken: Joi.string().required(),
      }).unknown(), 'headers'
);

const getAssessmentAnswerToCreateOrEdit = createSchemaMiddleware(
    Joi.object({
        resourceid: Joi.string().guid().required(),
        userid: Joi.string().guid().required(),
        standardid: Joi.string().guid().required(),
        accesstoken: Joi.string().required(),
      }).unknown(), 'headers'
);

module.exports = {
    createAssessmentAnswer,
    getAssessmentAnswer,
    getAssessmentAnswerToCreateOrEdit
};
