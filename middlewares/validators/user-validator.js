const Joi = require('joi');
const { handleInternalServerError, handleErrorResponse } = require('../../utils/response-handlers');
const logger = require("../../Logs/logger");

const createSchemaMiddleware = (schema) => async (req, res, next) => {
    try {
        const { error } = schema.validate(req.body);
        if (error) {
            return handleErrorResponse(res, 400, error.details[0].message);
        }
        next();
    } catch (error) {
        logger.error(error);
        handleInternalServerError(res);
    }
};

const updateUserProfile = createSchemaMiddleware(
    Joi.object({
        email: Joi.string().email().required(),
        name: Joi.string().required(),
        image: Joi.string().required(),
        password: Joi.string().allow('', "").required(),
        accessToken: Joi.string().required()
    })
);

module.exports = {
    updateUserProfile,
};
