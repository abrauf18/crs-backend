const Joi = require('joi');
const { handleInternalServerError, handleErrorResponse } = require('../../utils/response-handlers');
const { logger } = require("../../Logs/logger");

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

const updateSchoolAndUserProfile = createSchemaMiddleware(
    Joi.object({
        email: Joi.string().email().required(),
        username: Joi.string().required(),
        image: Joi.string().required(),
        password: Joi.string().allow('', "").required(),
        schoolName: Joi.string().required(),
        numOfClasses: Joi.number().positive().required(),
        classesStart: Joi.number().positive().allow(0).max(Joi.ref('classesEnd')).message('value of Classes Start should be greater than Classes End').required(),
        classesEnd: Joi.number().positive().allow(0).required(),
        accessToken: Joi.string().required()
    })
);

const getAllSchools = createSchemaMiddleware(
    Joi.object({
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

const createSchool = createSchemaMiddleware(
    Joi.object({
        email: Joi.string().email().required(),
        name: Joi.string().min(3).max(30).required(),
        schoolName: Joi.string().min(3).max(30).required(),
        password: Joi.string().required(),
    })
);

module.exports = {
    updateSchoolAndUserProfile,
    getAllSchools,
    createSchool
};
