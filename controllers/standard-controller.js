const standardService = require("../services/standard-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")

const createStandard = async (req, res) => {
    try {
        const { name, description, courseLength, dailyUploads } = req.body;

        const reply = await standardService.createStandard({ name, description, courseLength, dailyUploads });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

module.exports = {
    createStandard
};
