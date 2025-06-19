const Joi = require('joi');
const { handleInternalServerError, handleErrorResponse } = require('../../utils/response-handlers')

const createSchemaMiddleware = (schema) => async (req, res, next) => {
    try {
        const { error } = schema.validate(req.body);
        if (error) {
            return handleErrorResponse(res, 400, error.details[0].message)
        }
        next();
    } catch (error) {
        handleInternalServerError(res)
    }
};

const emailBasedInvite = createSchemaMiddleware(
    Joi.object({
        email: Joi.string().email().required(),
        role: Joi.string().valid('student', 'teacher', 'school', 'admin').required(),
        name: Joi.string().required(),
        schoolId: Joi.when('role', {
            is: Joi.string().valid('student', 'teacher'),
            then: Joi.string().required(),
            otherwise: Joi.string().optional()
        }),
        accessToken: Joi.string().required(),
    })
);
const emailBasedSignup = createSchemaMiddleware(
    Joi.object({
        email: Joi.string().email().required(),
        name: Joi.string().min(3).max(30).required(),
        password: Joi.string().required(),
    })
);
const signupSchema = createSchemaMiddleware(
    Joi.object({
        name: Joi.string().min(3).max(30).required(),
        password: Joi.string().required(),
        email: Joi.string().email().required(),
        role: Joi.string().valid('student', 'teacher', 'school', 'admin').required(),
        schoolId: Joi.when('role', {
            is: Joi.string().valid('student', 'teacher'),
            then: Joi.string().required(),
            otherwise: Joi.string().optional()
        }),
    })
);
const loginSchema = createSchemaMiddleware(
    Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    })
);
const registerSchoolSchema = createSchemaMiddleware(
    Joi.object({
        schoolOwnerEmail: Joi.string().email().required(),
        name: Joi.string().min(3).max(30).required(),
        numberOfTeachers: Joi.number().integer().min(0).required(),
        studentsPopulation: Joi.number().integer().min(0).required(),
        courses: Joi.array().items(Joi.string()).required(),
    })
);
const inviteTeacherSchema = createSchemaMiddleware(
    Joi.object({
        schoolOwnerEmail: Joi.string().email().required(),
        invites: Joi.array().items(
            Joi.object({
                name: Joi.string().min(3).max(30).required(),
                email: Joi.string().email().required(),
            })
        ).required(),
    })
);
const forgotPasswordSchema = createSchemaMiddleware(
    Joi.object({
        email: Joi.string().email().required(),
    })
);
const verifyOTPSchema = createSchemaMiddleware(
    Joi.object({
        userId: Joi.string().guid().required(),
        OTP: Joi.string().length(4).pattern(/^\d+$/).required(),
    })
);
const resetPasswordSchema = createSchemaMiddleware(
    Joi.object({
        userId: Joi.string().guid().required(),
        newPassword: Joi.string().required(),
    })
);

module.exports = {
    emailBasedInvite,
    emailBasedSignup,
    signupSchema,
    loginSchema,
    registerSchoolSchema,
    inviteTeacherSchema,
    forgotPasswordSchema,
    verifyOTPSchema,
    resetPasswordSchema,
};
