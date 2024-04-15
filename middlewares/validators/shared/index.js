const Joi = require('joi');
const { handleInternalServerError, handleErrorResponse } = require('../../../utils/response-handlers');

const verifyHeaderAccessToken = async (req, res, next) => {
    try {
        const data = {accessToken: req.headers['accesstoken']} // in headers casing is ignored

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

module.exports = {
   verifyHeaderAccessToken,
};
