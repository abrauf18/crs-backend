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

const updateStandard = async (req, res) => {
    try {
        const { standardId, name, description, courseLength, dailyUploads } = req.body;

        const reply = await standardService.updateStandard({ standardId, name, description, courseLength, dailyUploads });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, "Standard not found");
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

const getStandard = async (req, res) => {
    try {
        const { standardid } = req.headers;

        const reply = await standardService.getStandard({ standardId: standardid });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, "Standard not found");
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
    createStandard,
    updateStandard,
    getStandard,
};
