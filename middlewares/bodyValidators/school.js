const Joi = require('joi');
const { handleInternalServerError, handleErrorResponse } = require('../../utils/responseHandlers');

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

const updateSchoolProfile = createSchemaMiddleware(
    Joi.object({
        name: Joi.string().required(),
        numOfClasses: Joi.number().positive().required(),
        classesStart: Joi.number().positive().allow(0).max(Joi.ref('classesEnd')).message('value of Classes Start should be greater than Classes End').required(),
        classesEnd: Joi.number().positive().required(),
        accessToken: Joi.string().required()
    })
);

module.exports = {
    updateSchoolProfile,
};
