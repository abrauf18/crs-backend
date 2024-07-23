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

const createResource = createSchemaMiddleware(
    Joi.object({
        name: Joi.string().required(),
        url: Joi.string().required(),
        type: Joi.string().valid(
            RESOURCE_TYPES.SLIDESHOW,
            RESOURCE_TYPES.VIDEO,
            RESOURCE_TYPES.EXIT_TICKET_TEST,
            RESOURCE_TYPES.WORKSHEET,
            RESOURCE_TYPES.QUIZ,
            RESOURCE_TYPES.ASSIGNMENT,
            RESOURCE_TYPES.LAB,
            RESOURCE_TYPES.STATION,
            RESOURCE_TYPES.ACTIVITY,
            RESOURCE_TYPES.GUIDED_NOTE,
            RESOURCE_TYPES.FORMATIVE_ASSESSMENT,
            RESOURCE_TYPES.SUMMARIZE_ASSESSMENT,
            RESOURCE_TYPES.DATA_TRACKER,
        ).required(),
        topic: Joi.string().required(),
        accessToken: Joi.string().required(),
        thumbnailURL: Joi.string().when('type', {
            is: RESOURCE_TYPES.VIDEO,
            then: Joi.required(),
            otherwise: Joi.optional()
        }),
        duration: Joi.string().optional(),
        totalMarks: Joi.number().integer().min(0).when('type', {
            is: Joi.valid(RESOURCE_TYPES.WORKSHEET, RESOURCE_TYPES.QUIZ, RESOURCE_TYPES.ASSIGNMENT, RESOURCE_TYPES.EXIT_TICKET_TEST, RESOURCE_TYPES.FORMATIVE_ASSESSMENT, RESOURCE_TYPES.SUMMARIZE_ASSESSMENT),
            then: Joi.required(),
            otherwise: Joi.optional()
        }),
        deadline: Joi.number().integer().min(0).when('type', {
            is: Joi.valid(RESOURCE_TYPES.WORKSHEET, RESOURCE_TYPES.QUIZ, RESOURCE_TYPES.ASSIGNMENT, RESOURCE_TYPES.EXIT_TICKET_TEST, RESOURCE_TYPES.FORMATIVE_ASSESSMENT, RESOURCE_TYPES.SUMMARIZE_ASSESSMENT),
            then: Joi.required(),
            otherwise: Joi.optional()
        }),
    })
);

const deleteResource = createSchemaMiddleware(
    Joi.object({
        resourceid: Joi.string().guid().required(), // in headers casing is ignored
        accesstoken: Joi.string().required() // in headers casing is ignored
    }).unknown(), 'headers'
);

const getResources = createSchemaMiddleware(
    Joi.object({
        type: Joi.string().valid(
            RESOURCE_TYPES.SLIDESHOW,
            RESOURCE_TYPES.VIDEO,
            RESOURCE_TYPES.EXIT_TICKET_TEST,
            RESOURCE_TYPES.WORKSHEET,
            RESOURCE_TYPES.QUIZ,
            RESOURCE_TYPES.ASSIGNMENT,
            RESOURCE_TYPES.LAB,
            RESOURCE_TYPES.STATION,
            RESOURCE_TYPES.ACTIVITY,
            RESOURCE_TYPES.GUIDED_NOTE,
            RESOURCE_TYPES.FORMATIVE_ASSESSMENT,
            RESOURCE_TYPES.SUMMARIZE_ASSESSMENT,
            RESOURCE_TYPES.DATA_TRACKER,
        ).allow('').optional(),
        topic: Joi.string().allow('').optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).optional(),
        orderBy: Joi.string().valid('createdAt', 'name', '').optional(),
        sortBy: Joi.string().valid('asc', 'desc', '').optional(),
    }).unknown(), 'query'
);

const getResource = createSchemaMiddleware(
    Joi.object({
        resourceid: Joi.string().guid().required(), // in headers casing is ignored
        accesstoken: Joi.string().required() // in headers casing is ignored
    }).unknown(), 'headers'
);

const getResourceCount = createSchemaMiddleware(
    Joi.object({
        topic: Joi.string().required(), // in headers casing is ignored
        accesstoken: Joi.string().required() // in headers casing is ignored
    }).unknown(), 'headers'
);

const updateResource = createSchemaMiddleware(
    Joi.object({
        resourceId: Joi.string().guid().required(),
        name: Joi.string().required(),
        type: Joi.string().valid(
            RESOURCE_TYPES.SLIDESHOW,
            RESOURCE_TYPES.VIDEO,
            RESOURCE_TYPES.EXIT_TICKET_TEST,
            RESOURCE_TYPES.WORKSHEET,
            RESOURCE_TYPES.QUIZ,
            RESOURCE_TYPES.ASSIGNMENT,
            RESOURCE_TYPES.LAB,
            RESOURCE_TYPES.STATION,
            RESOURCE_TYPES.ACTIVITY,
            RESOURCE_TYPES.GUIDED_NOTE,
            RESOURCE_TYPES.FORMATIVE_ASSESSMENT,
            RESOURCE_TYPES.SUMMARIZE_ASSESSMENT,
            RESOURCE_TYPES.DATA_TRACKER,
        ).required(),
        topic: Joi.string().required(),
        accessToken: Joi.string().required(),
        totalMarks: Joi.number().integer().min(0).when('type', {
            is: Joi.valid(RESOURCE_TYPES.WORKSHEET, RESOURCE_TYPES.QUIZ, RESOURCE_TYPES.ASSIGNMENT, RESOURCE_TYPES.EXIT_TICKET_TEST, RESOURCE_TYPES.FORMATIVE_ASSESSMENT, RESOURCE_TYPES.SUMMARIZE_ASSESSMENT,),
            then: Joi.required(),
            otherwise: Joi.optional()
        }),
        deadline: Joi.number().integer().min(0).when('type', {
            is: Joi.valid(RESOURCE_TYPES.WORKSHEET, RESOURCE_TYPES.QUIZ, RESOURCE_TYPES.ASSIGNMENT, RESOURCE_TYPES.EXIT_TICKET_TEST, RESOURCE_TYPES.FORMATIVE_ASSESSMENT, RESOURCE_TYPES.SUMMARIZE_ASSESSMENT),
            then: Joi.required(),
            otherwise: Joi.optional()
        }),
    })
);

const getResourcesByType = createSchemaMiddleware(
    Joi.object({
        resourcetype: Joi.string().valid(
            RESOURCE_TYPES.SLIDESHOW,
            RESOURCE_TYPES.VIDEO,
            RESOURCE_TYPES.EXIT_TICKET_TEST,
            RESOURCE_TYPES.WORKSHEET,
            RESOURCE_TYPES.QUIZ,
            RESOURCE_TYPES.ASSIGNMENT,
            RESOURCE_TYPES.LAB,
            RESOURCE_TYPES.STATION,
            RESOURCE_TYPES.ACTIVITY,
            RESOURCE_TYPES.GUIDED_NOTE,
            RESOURCE_TYPES.FORMATIVE_ASSESSMENT,
            RESOURCE_TYPES.SUMMARIZE_ASSESSMENT,
            RESOURCE_TYPES.DATA_TRACKER,
        ).required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

const getResourcesByName = createSchemaMiddleware(
    Joi.object({
        resourcename: Joi.string().required(),
        resourcetype: Joi.string().valid(
            RESOURCE_TYPES.SLIDESHOW,
            RESOURCE_TYPES.VIDEO,
            RESOURCE_TYPES.EXIT_TICKET_TEST,
            RESOURCE_TYPES.WORKSHEET,
            RESOURCE_TYPES.QUIZ,
            RESOURCE_TYPES.ASSIGNMENT,
            RESOURCE_TYPES.LAB,
            RESOURCE_TYPES.STATION,
            RESOURCE_TYPES.ACTIVITY,
            RESOURCE_TYPES.GUIDED_NOTE,
            RESOURCE_TYPES.FORMATIVE_ASSESSMENT,
            RESOURCE_TYPES.SUMMARIZE_ASSESSMENT,
            RESOURCE_TYPES.DATA_TRACKER,
        ).required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

module.exports = {
    createResource,
    deleteResource,
    getResourceCount,
    getResources,
    getResource,
    updateResource,
    getResourcesByType,
    getResourcesByName
};
