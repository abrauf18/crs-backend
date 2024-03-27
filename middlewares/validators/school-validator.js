const Joi = require('joi');
const { handleInternalServerError, handleErrorResponse } = require('../../utils/response-handlers');

const createSchemaMiddleware = (schema) => async (req, res, next) => {
    try {
        const { error } = schema.validate(req.body);
        if (error) {
            return handleErrorResponse(res, 400, error.details[0].message);
        }
        next();
    } catch (error) {
        console.log(error);
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

module.exports = {
    updateSchoolAndUserProfile,
};
