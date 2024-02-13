const { User } = require("../../models/index.js");
const jwt = require("../../utils/jwt.js");
const { handleInternalServerError, handleErrorResponse } = require("../../utils/responseHandlers.js")

const setUser = async (req, res, next) => {
    try {
        authcookie = req.cookies.authcookie;

        if(!authcookie) {
            handleErrorResponse(res, 403, "Invalid Access, Please Signin to move ahead");
        } 
        else {

            const { email, userId } = jwt.verifyAccessToken(authcookie);
    
            const user = await User.findOne({ where: { email } });
    
            if (!user) {
                handleErrorResponse(res, 404, "User Not Found");
            }
    
            req.user = user;
    
            next();
        }
    } catch (error) {
        console.log(error);
        handleInternalServerError(res);
    }
}

const VerifyAllowedRole = (allowedRoles) => async (req, res, next) => {
    const userRole = req.user.role;

    if (allowedRoles.includes(userRole)) {
        next();
    } else {
        handleErrorResponse(res, 403, "You are NOT authorized to access");
    }
};

module.exports = {
    setUser,
    VerifyAllowedRole
};


