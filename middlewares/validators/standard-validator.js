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

const createStandard = createSchemaMiddleware(
    Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
        dailyUploads: Joi.array().items(Joi.object({
            resourceId: Joi.string().guid().required(),
            accessDate: Joi.date().required().iso().messages({'date.format': '"accessDate" should be in YYYY-MM-DD format'}),
        })).required(),
        accessToken: Joi.string().required()
    })
);

const updateStandard = createSchemaMiddleware(
    Joi.object({
        standardId: Joi.string().guid().required(),
        name: Joi.string().required(),
        description: Joi.string().required(),
        dailyUploads: Joi.array().items(Joi.object({
            resourceId: Joi.string().guid().required(),
            accessDate: Joi.date().required().iso().messages({'date.format': '"accessDate" should be in YYYY-MM-DD format'}),
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

module.exports = {
    createStandard,
    updateStandard,
    getStandard,
    getSummarizedStandard
};
