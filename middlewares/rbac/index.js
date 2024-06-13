// @ts-nocheck
const { User } = require("../../models/index.js");
const jwt = require("../../utils/jwt.js");
const { errorHandlingWrapper, handleInternalServerError, handleErrorResponse } = require("../../utils/response-handlers.js")

const setUser = async (req, res, next) => {
    try {
        const accessToken = req.body.accessToken? req.body.accessToken: req.headers['accesstoken'];

        const result = jwt.verifyAccessToken(accessToken);
    
        if (result.success) {
    
            const { email, userId } = result.decoded;
    
            const user = await User.findOne({ where: { email } });
    
            if (!user) {
                return handleErrorResponse(res, 404, "User Not Found, Please signup first");
            }
            else {
                req.user = user;
                next();
            }
        }
        else if(!result.success && result.error == "Token expired") {
            handleErrorResponse(res, 403, "Token expired, please signin");
        } 
        else {
            return handleErrorResponse(res, 400, "Token invalid, please signin");
        }
    } catch (error) {
        return handleInternalServerError(res);
    }
};

const oldSetUser = async (req, res, next) => {
    try {
        authcookie = req.cookies.authcookie;
    
        if (!authcookie) {
            handleErrorResponse(res, 403, "Invalid Access, Please Signin to move ahead");
        }
        else {
            const result = jwt.verifyAccessToken(authcookie);
    
            if (result.success) {
    
                const { email, userId } = result.decoded;
    
                const user = await User.findOne({ where: { email } });
    
                if (!user) {
                    return handleErrorResponse(res, 404, "User Not Found, Please signup first");
                }
                else {
                    req.user = user;
    
                    next();
                }
            }
            else if(!result.success && error == "Token expired") {
                handleErrorResponse(res, 403, "Token expired, please signin");
            } 
            else {
                return handleInternalServerError(res);
            }
        }
    } catch (error) {
        return handleInternalServerError(res);
    }
};

const VerifyAllowedRole = (allowedRoles) => async (req, res, next) => {
    try {
        const userRole = req.user.role;
    
        if (allowedRoles.includes(userRole)) {
            next();
        } 
        else {
            return handleErrorResponse(res, 403, "You are NOT authorized to access");
        }
    } catch (error) {
        handleInternalServerError(res);
    }
};

module.exports = {
    setUser,
    oldSetUser,
    VerifyAllowedRole
};


