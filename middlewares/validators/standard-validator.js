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

const createStandard = createSchemaMiddleware(
    Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
        topics: Joi.array().items(Joi.object({
            name: Joi.string().required(),
            description: Joi.string().required(),
        })).required(),
        dailyUploads: Joi.array().items(Joi.object({
            topicName: Joi.array().items(Joi.string()).required(),
            resourceId: Joi.string().guid().required(),
            weightage: Joi.number().integer().required(),
            accessibleDay: Joi.number().integer().required(),
        })).required(),
        accessToken: Joi.string().required()
    })
);

const updateStandard = createSchemaMiddleware(
    Joi.object({
        standardId: Joi.string().guid().required(),
        name: Joi.string().required(),
        description: Joi.string().required(),
        topics: Joi.array().items(Joi.object({
            name: Joi.string().required(),
            description: Joi.string().required(),
        })).required(),
        dailyUploads: Joi.array().items(Joi.object({
            topicName: Joi.array().items(Joi.string()).required(),
            resourceId: Joi.string().guid().required(),
            weightage: Joi.number().integer().required(),
            accessibleDay: Joi.number().integer().required(),
        })).required(),
        accessToken: Joi.string().required()
    })
);

const getStandard = createSchemaMiddleware(
    Joi.object({
        standardid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

const getSummarizedStandard = createSchemaMiddleware(
    Joi.object({
        standardid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

const deleteStandard = createSchemaMiddleware(
    Joi.object({
        standardid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

const getStandardTopics = createSchemaMiddleware(
    Joi.object({
        standardid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

const getTopicResources = createSchemaMiddleware(
    Joi.object({
        standardid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);// has topicName in query params now

const getStandardClassroomsAndTeacherClassrooms = createSchemaMiddleware(
    Joi.object({
        standardid: Joi.string().guid().required(),
        teacherid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

module.exports = {
    createStandard,
    updateStandard,
    getStandard,
    getSummarizedStandard,
    deleteStandard,
    getStandardTopics,
    getTopicResources,
    getStandardClassroomsAndTeacherClassrooms
};
