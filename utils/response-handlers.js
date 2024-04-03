const {logger} = require("../Logs/logger.js");

const handleInternalServerError = (res) => {
    res.status(500).json({
        status: "error",
        message: "Internal Server Error: Unable to complete the request, please try again later.",
    });
}

const handleSuccessResponse = (res, code = 200, data, cookieDetails) => {
    try {
        if (cookieDetails) {
            res
                .status(code)
                .cookie(cookieDetails.name, cookieDetails.accessToken, cookieDetails.options)
                .json({
                    status: "success",
                    data: data
                });
        }
        else {
            res.status(code).json({
                status: "success",
                data: data
            });
        }

    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        handleInternalServerError(res);
    }
}

const handleErrorResponse = (res, code = 400, message) => {
    try {
        res.status(code).json({
            status: "error",
            message: message
        });
    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        handleInternalServerError(res);
    }
}

module.exports = {
    handleInternalServerError,
    handleSuccessResponse,
    handleErrorResponse
}