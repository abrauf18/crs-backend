const Joi = require('joi');
const bcrypt = require("bcrypt");
const jwt = require("../utils/jwt");
const { User, School } = require("../models");

const signupSchema = async (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            password: Joi.string().required(),
            email: Joi.string().email().required(),
            role: Joi.string().valid("student", "teacher", "school", "admin").required(),
        });
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ status: "error",
                message: error.details[0].message  
            });
        } 
        next();
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error, please try again later.",
          });
    }
}
const loginSchema = async (req, res, next) => {
    try {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required(),
        });
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ status: "error",
                message: error.details[0].message  
            });
        } 
        next();
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error, please try again later.",
        });
    }
}
const registerSchoolSchema = async (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            numberOfTeachers: Joi.number().integer().min(0).required(),
            studentsPopulation: Joi.number().integer().min(0).required(),
            courses: Joi.array().items(Joi.string()).required(),
        });
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ status: "error",
                message: error.details[0].message  
            });
        } 
        next();
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error, please try again later.",
        });
    }
}
const inviteTeacherSchema = async (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
        });
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ status: "error",
                message: error.details[0].message  
            });
        } 
        next();
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error, please try again later.",
        });
    }
}
const forgotPasswordSchema = async (req, res, next) => {
    try {
        const schema = Joi.object({
            email: Joi.string().email().required(),
        });
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ status: "error",
                message: error.details[0].message  
            });
        } 
        next();
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error, please try again later.",
        });
    }
}
const resetPasswordSchema = async (req, res, next) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().integer().required(),
            newPassword: Joi.string().required(),
        });
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ status: "error",
                message: error.details[0].message  
            });
        } 
        next();
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error, please try again later.",
        });
    }
}

const UserShouldNotPreExist = async (req, res, next) => {
    try {
        const { email } = req.body;

        const isEmailRegisterd = await User.findOne({ where: { email } });

        if (isEmailRegisterd) {
            return res
                .status(401)
                .json({ status: "error", message: "Email already registered" });
        }

        return next();
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ status: "error", message: "Internal Server Error" });
    }
};

const UserShouldPreExist = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res
                .status(401)
                .json({ status: "error", message: "Invalid credentials" });
        }

        req.user = user;

        return next();
    } catch (error) {
        return res
            .status(500)
            .json({ status: "error", message: "Internal Server Error" });
    }
};

const VerifyPassword = async (req, res, next) => {
    try {
        const { password } = req.body;

        const user = req.user;

        if (!bcrypt.compareSync(password, user.password)) {
            return res
                .status(401)
                .json({ status: "error", message: "Invalid credentials" });
        }

        return next();
    } catch (error) {
        return res
            .status(500)
            .json({ status: "error", message: "Internal Server Error" });
    }
};

const decodeAuthCookie = async (req, res, next) => {
    try {
        authcookie = req.cookies.authcookie;

        const { email, userId } = jwt.verifyAccessToken(authcookie);

        req.email = email;
        req.userId = userId;

        next();
    } catch (error) {
        return res
            .status(401)
            .json({ status: "error", message: "Invalid credentials" });
    }
};

const getEmailFromBody = async (req, res, next) => {
    try {
        const { email } = req.body;

        req.email = email;

        next();
    } catch (error) {
        return res
            .status(401)
            .json({ status: "error", message: "Invalid credentials" });
    }
};

const setUserUsingEmail = async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { email: req.email } });

        if (!user) {
            return res
            .status(401)
            .json({ status: "error", message: "Email not registered" });
        }

        req.user = user;

        next();
    } catch (error) {
        return res
            .status(401)
            .json({ status: "error", message: "Invalid credentials" });
    }
};

const setSchoolUsingUserID = async (req, res, next) => {
    try {
        const school = await School.findOne({ where: { createdBy: req.user.id } });

        if (school === null) {
            console.log("Not found!");
        } 
        else {
            req.school = school;
            next();
        }
    } catch (error) {
        return res
            .status(404)
            .json({ status: "error", message: "School Not Found" });
    }
};

module.exports = {
    signupSchema,
    loginSchema,
    registerSchoolSchema,
    inviteTeacherSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    UserShouldNotPreExist,
    UserShouldPreExist,
    VerifyPassword,
    decodeAuthCookie,
    getEmailFromBody,
    setUserUsingEmail,
    setSchoolUsingUserID
};
