const Joi = require('joi');
const { handleInternalServerError, handleErrorResponse } = require('../../../utils/responseHandlers');

const verifyHeaderAccessToken = async (req, res, next) => {
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

module.exports = {
   verifyHeaderAccessToken,
};
