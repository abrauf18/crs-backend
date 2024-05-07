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
        courseLength: Joi.string().required(),
        dailyUploads: Joi.array().items(Joi.object({
            resourceId: Joi.string().guid({ version: 'uuidv4' }).required(),
            accessDate: Joi.date().required(),
        })).required(),
        accessToken: Joi.string().required()
    })
);

module.exports = {
    createStandard
};
