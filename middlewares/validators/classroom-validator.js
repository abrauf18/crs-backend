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

const createClassroom = async (req, res, next) => {
    try {
        const schema = Joi.object({
            teacherId: Joi.string().guid().required(),
            name: Joi.string().required(),
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

const getClassroom = createSchemaMiddleware(
    Joi.object({
        classroomid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

const getAllClassroomsOfTeacher = createSchemaMiddleware(
    Joi.object({
        teacherid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

const assignStandardToClassroom = createSchemaMiddleware(
    Joi.object({
        classroomIds: Joi.array().items(Joi.string().guid()).required(),
        standardId: Joi.string().guid().required(),
        accessToken: Joi.string().required()
    })
);

const getSummarizedClassroomsOfTeacher = createSchemaMiddleware(
    Joi.object({
        teacherid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);


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
    createClassroom,
    getClassroom,
    getAllClassroomsOfTeacher,
    assignStandardToClassroom,
    getSummarizedClassroomsOfTeacher,
    getTeacherDashboardClassroomsOverview,
    getTeacherDashboardStandardsOverview,
    deleteClassroom
};
