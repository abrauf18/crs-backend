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

const getTeacherDashboardClassroomsOverview = createSchemaMiddleware(
    Joi.object({
        teacherid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

const getTeacherDashboardStandardsOverview = createSchemaMiddleware(
    Joi.object({
        teacherid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

const deleteClassroom = createSchemaMiddleware(
    Joi.object({
        classroomcourseid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

module.exports = {
    getTeacherDashboardClassroomsOverview,
    getTeacherDashboardStandardsOverview,
    deleteClassroom
};
