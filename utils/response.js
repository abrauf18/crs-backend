function successResponse(res, statusCode, message, data = null, pagination = null, token = null) {
    const response = {
        "status": "success",
        "statusCode": statusCode,
        "message": message,
    };
   
    if (data !== null) {
        response.data = data;

        if (pagination !== null) {
            response.data.pagination = pagination;
        }
    }
    if (token !== null) {
        response.token = token;
    }
    res.status(statusCode).json(response);
}


function failureResponse(res, statusCode, message) {
    const response = {
        "status": "error",
        "statusCode": statusCode,
        "message": message,
    };

    res.status(statusCode).json(response);
}

module.exports = {successResponse , failureResponse}