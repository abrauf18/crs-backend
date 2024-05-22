const Joi = require('joi');
const { logger } = require("../../Logs/logger");
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

const getVideoQuestions = createSchemaMiddleware(
    Joi.object({
        videoid: Joi.string().guid().required(),
        accesstoken: Joi.string().required(),
    }).unknown(), 'headers'
);

const createVideoQuestions = async (req, res, next) => {
    try {
        const optionsKeys = Object.keys(req.body.options || {});
        const schema = Joi.object({
                videoId: Joi.string().guid().required(),
                questions: Joi.array().items(
                    Joi.object({
                    statement: Joi.string().required(),
                    options: Joi.object()
                        .pattern(Joi.string(), Joi.string().required())
                        .min(0)
                        .required(),
                    correctOption: Joi.string().valid(...optionsKeys).when('options', {
                        is: Joi.object().min(1),
                        then: Joi.required(),
                        otherwise: Joi.optional().valid("").messages({
                            "any.only": "\"correctOption\" must be empty"
                        })
                    }),
                    correctOptionExplanation: Joi.string().when('options', {
                        is: Joi.object().min(1),
                        then: Joi.required(),
                        otherwise: Joi.optional().allow("")
                    }),
                    totalMarks: Joi.number().integer().min(0).required(),
                    popUpTime: Joi.string().pattern(/^(?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d)$/).message("Popup Time: pattern 00:00:00 not followed").required(),
                })
            ),
            accessToken: Joi.string().required()
        });
        const { error } = schema.validate(req.body);
        if (error) {
            return handleErrorResponse(res, 400, error.details[0].message);
        }
        next();
    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        handleInternalServerError(res);
    }
};


module.exports = {
    createVideoQuestions,
    getVideoQuestions
};
