const Joi = require('joi');

const createSchemaMiddleware = (schema) => async (req, res, next) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: 'error',
          message: error.details[0].message,
        });
      }
      next();
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Internal Server Error: sorry for the inconvenience, please try again later.',
      });
    }
};

const signupSchema = createSchemaMiddleware(
    Joi.object({
      name: Joi.string().required(),
      password: Joi.string().required(),
      email: Joi.string().email().required(),
      role: Joi.string().valid('student', 'teacher', 'school', 'admin').required(),
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
        name: Joi.string().required(),
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
                name: Joi.string().required(),
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
        userId: Joi.number().integer().positive().required(),
        OTP: Joi.string().length(4).pattern(/^\d+$/).required(),
    })
);
const resetPasswordSchema = createSchemaMiddleware(
    Joi.object({
        userId: Joi.number().integer().required(),
        newPassword: Joi.string().required(),
    })
);

module.exports = {
    signupSchema,
    loginSchema,
    registerSchoolSchema,
    inviteTeacherSchema,
    forgotPasswordSchema,
    verifyOTPSchema,
    resetPasswordSchema,
};
