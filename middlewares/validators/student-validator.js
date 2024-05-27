const Joi = require('joi');
const { logger } = require("../../Logs/logger");
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

const getStudentCurrentStandards = createSchemaMiddleware(
    Joi.object({
        studentid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

const getStudentVideo = createSchemaMiddleware(
    Joi.object({
        videoid: Joi.string().guid().required(),
        studentid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

const storeStudentVideo = createSchemaMiddleware(
    Joi.object({
        videoId: Joi.string().guid().required(),
        studentId: Joi.string().guid().required(),
        last_seen_time: Joi.string().pattern(/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).required().messages({
            'string.pattern.base': 'last_seen_time must be in the format HH:MM:SS',
        }),
        accessToken: Joi.string().required()
    })
);

const getStudentStandard = createSchemaMiddleware(
    Joi.object({
        standardid: Joi.string().guid().required(),
        studentid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

module.exports = {
    getStudentCurrentStandards,
    getStudentVideo,
    storeStudentVideo,
    getStudentStandard
};
