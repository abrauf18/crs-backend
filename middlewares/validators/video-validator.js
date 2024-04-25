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

const createVideo = createSchemaMiddleware(
    Joi.object({
        resourceId: Joi.string().guid().required(),
        accessToken: Joi.string().required(),
        thumbnailURL: Joi.string().required(),
        topics: Joi.object().pattern(
            Joi.string().pattern(/^(?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d)$/).message("Time: pattern 00:00:00 not followed"),
            Joi.string()
        ).required()
    })
);

const createMinimalVideo = createSchemaMiddleware(
    Joi.object({
        resourceId: Joi.string().guid().required(),
        accessToken: Joi.string().required(),
        thumbnailURL: Joi.string().required(),
    })
);

const addTopicsInVideo = createSchemaMiddleware(
    Joi.object({
        videoId: Joi.string().guid().required(),
        accessToken: Joi.string().required(),
        topics: Joi.object().pattern(
            Joi.string().pattern(/^(?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d)$/).message("Time: pattern 00:00:00 not followed"),
            Joi.string()
        ).required(),
    })
);

const deleteVideo = createSchemaMiddleware(
    Joi.object({
        videoid: Joi.string().guid().required(),
        accesstoken: Joi.string().required(),
      }).unknown(), 'headers'
);

const getVideo = createSchemaMiddleware(
    Joi.object({
        videoid: Joi.string().guid().required(),
        accesstoken: Joi.string().required(),
      }).unknown(), 'headers'
);

module.exports = {
    createVideo,
    deleteVideo,
    getVideo,
    createMinimalVideo,
    addTopicsInVideo
};
