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

const createClassroom = async (req, res, next) => {
    try {
        const schema = Joi.object({
            schoolId: Joi.string().guid().required(),
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

const getClassesAndCourses = createSchemaMiddleware(
    Joi.object({
        teacherid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

const deleteClassCourse = createSchemaMiddleware(
    Joi.object({
        classroomcourseid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

const getClassroomStudents = createSchemaMiddleware(
    Joi.object({
        classroomid: Joi.string().guid().required(),
        accesstoken: Joi.string().required(),
        page: Joi.number().integer().min(1).required(), 
        limit: Joi.number().integer().min(1).required()
    }).unknown(), 'headers'
);

const addStudentToClassroom = createSchemaMiddleware(
    Joi.object({
        classroomId: Joi.string().guid().required(),
        studentId: Joi.string().guid().required(),
        accessToken: Joi.string().required()
    })
);

const removeStudentFromClassroom = createSchemaMiddleware(
    Joi.object({
        classroomstudentid: Joi.string().guid().required(),
        accesstoken: Joi.string().required()
    }).unknown(), 'headers'
);

const updateClassroomStudent = createSchemaMiddleware(
    Joi.object({
        classroomStudentId: Joi.string().guid().required(),
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        classroomId: Joi.string().guid().required(),
        image: Joi.string().required(),
        accessToken: Joi.string().required()
    })
);

module.exports = {
    createClassroom,
    getClassroom,
    getAllClassroomsOfTeacher,
    assignStandardToClassroom,
    getSummarizedClassroomsOfTeacher,
    getClassesAndCourses,
    deleteClassCourse,
    getClassroomStudents,
    addStudentToClassroom,
    removeStudentFromClassroom,
    updateClassroomStudent
};
