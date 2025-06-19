const Joi = require('joi');
const { logger } = require("../../Logs/logger");
const { handleInternalServerError, handleErrorResponse } = require('../../utils/response-handlers');
const { CLASSROOM_STATUS } = require('../../utils/enumTypes');

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

const classCoursesSchema = Joi.array().items(
    Joi.object({
        classroomId: Joi.string().guid().required(),
        startDate: Joi.date().required().iso().messages({'date.format': '"Start Date" should be in YYYY-MM-DD format'}),
    })
).required();
const assignStandardToClassroom = createSchemaMiddleware(
    Joi.object({
        standardId: Joi.string().guid().required(),
        accessToken: Joi.string().required(),
        classCourses: classCoursesSchema
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
        email: Joi.string().email().required(),
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
        studentId: Joi.string().guid().required(),
        name: Joi.string().optional(),
        email: Joi.string().email().optional(),
        classroomId: Joi.string().guid().optional(),
        image: Joi.string().optional(),
        accessToken: Joi.string().required()
    })
);

const updateTeacherClassrooms = createSchemaMiddleware(
    Joi.object({
        schoolId: Joi.string().guid().required(),
        teacherId: Joi.string().guid().required(),
        classroomIds: Joi.array().items(Joi.string().guid().optional()).required(),
        accessToken: Joi.string().required(),
    })
);

const changeClassStatus = createSchemaMiddleware(
    Joi.object({
        schoolId: Joi.string().guid().required(),
        classroomId: Joi.string().guid().required(),
        status: Joi.string().valid(CLASSROOM_STATUS.ACTIVE, CLASSROOM_STATUS.INACTIVE).required(),
        accessToken: Joi.string().required()
    })
);

const getSchoolClassrooms = createSchemaMiddleware(
    Joi.object({
        accesstoken: Joi.string().required(),
        schoolid: Joi.string().guid().required(),
        page: Joi.number().integer().min(1).required(),
        limit: Joi.number().integer().min(1).required(),
        search: Joi.string().optional().allow(''),
    }).unknown(), 'headers'
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
    updateClassroomStudent,
    updateTeacherClassrooms,
    changeClassStatus,
    getSchoolClassrooms
};
