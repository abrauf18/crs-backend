const bcrypt = require("bcrypt");
const jwt = require("../utils/jwt");
const { User, School } = require("../models");

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

const decodeAuthAndSetUser = async (req, res, next) => {
    try {
        authcookie = req.cookies.authcookie;

        const { email, userID } = jwt.verifyAccessToken(authcookie);

        req.email = email;
        req.userID = userID;

        const user = await User.findOne({ where: { email } });
        req.user = user;

        next();
    } catch (error) {
        return res
            .status(401)
            .json({ status: "error", message: "Invalid credentials" });
    }
};

const decodeForgotPasswordAuth = async (req, res, next) => {
    try {
        const { email, userID } = jwt.verifyForgotPasswordToken(validationCookie);

        req.email = email;
        req.userID = userID;

        const user = await User.findOne({ where: { email } });
        req.user = user;

        next();
    } catch (error) {
        return res
            .status(401)
            .json({ status: "error", message: "Invalid credentials" });
    }
};

const deStructureBodyAndSetUser = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ where: { email } });
        
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

const setSchoolWithDecodedUser = async (req, res, next) => {
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
    UserShouldNotPreExist,
    UserShouldPreExist,
    VerifyPassword,
    decodeAuthAndSetUser,
    deStructureBodyAndSetUser,
    setSchoolWithDecodedUser,
    decodeForgotPasswordAuth
};
