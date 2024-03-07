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

const getUserProfile = async (req, res, next) => {
    try {
        const data = {accessToken: req.headers['accesstoken']}

        const schema = Joi.object({
            accessToken: Joi.string().required(),
        });
    
        const { error } = schema.validate(data);
        if (error) {
            return handleErrorResponse(res, 400, error.details[0].message);
        }
        next();
    } catch (error) {
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
    getUserProfile,
    updateUserProfile,
};
