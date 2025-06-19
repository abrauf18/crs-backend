const Joi = require('joi');
const { handleInternalServerError, handleErrorResponse } = require('../../utils/response-handlers');
const {logger} = require("../../Logs/logger");

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

const updateUserProfile = createSchemaMiddleware(
    Joi.object({
        email: Joi.string().email().required(),
        name: Joi.string().required(),
        image: Joi.string().required(),
        password: Joi.string().allow('', "").required(),
        schoolName: Joi.string().optional(),
        accessToken: Joi.string().required()
    })
);

const getAllUsersProfile = createSchemaMiddleware(
    Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).optional(),
        orderBy: Joi.string().valid('createdAt', 'name', '').optional(),
        sortBy: Joi.string().valid('asc', 'desc', '').optional(),
      }).unknown(), 'query'
);

const updateAnotherUsersProfile = createSchemaMiddleware(
    Joi.object({
        userId: Joi.string().guid().required(),
        email: Joi.string().email().required(),
        name: Joi.string().required(),
        image: Joi.string().required(),
        role: Joi.string().valid('student', 'teacher', 'school', 'admin').required(),
        accessToken: Joi.string().required()
    })
);

const deleteAnotherUsersProfile = createSchemaMiddleware(
    Joi.object({
        userid: Joi.string().guid().required(), // in headers casing is ignored
        accesstoken: Joi.string().required() // in headers casing is ignored
    }).unknown(), 'headers'
);

module.exports = {
    updateUserProfile,
    getAllUsersProfile,
    updateAnotherUsersProfile,
    deleteAnotherUsersProfile
};
