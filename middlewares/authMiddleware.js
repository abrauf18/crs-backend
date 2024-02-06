const bcrypt = require("bcrypt");
const { User } = require("../models");
const jwt = require("../utils/jwt")

const UserShouldNotPreExist = async(req, res, next) => {
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
}

const UserShouldPreExist = async(req, res, next) => {
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
}

const VerifyPassword = async(req, res, next) => {
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
}

const decodeAuthToken = async(req, res, next) => {
    try {
        const authcookie = req.cookies.authcookie;

        const { email, userID } = jwt.verifyAccessToken(authcookie);
    
        // req.email = email;
        // req.userID = userID;

        const user = await User.findOne({ where: { email } });
        req.user = user;
    
        next();
    } catch (error) {
        return res
            .status(401)
            .json({ status: "error", message: "Invalid credentials" });
    }
}

module.exports = {
    UserShouldNotPreExist,
    UserShouldPreExist,
    VerifyPassword,
    decodeAuthToken
}