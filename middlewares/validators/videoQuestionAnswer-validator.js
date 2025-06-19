const Joi = require('joi');
const { logger } = require("../../Logs/logger");
const { RESOURCE_TYPES, RESOURCE_STATUS } = require('../../utils/enumTypes');
const { handleInternalServerError, handleErrorResponse } = require('../../utils/response-handlers');
const { access } = require('fs');

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

const createVideoQuestionAnswer = createSchemaMiddleware(
    Joi.object({
        accessToken: Joi.string().required(),
        userId: Joi.string().guid().required(),
        questionId: Joi.string().guid().required(),
        answer: Joi.string().required().allow(""),
        standardId: Joi.string().guid().required(),
    })
);

module.exports = {
    createVideoQuestionAnswer,
};
