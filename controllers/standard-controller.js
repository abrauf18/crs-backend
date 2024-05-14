const standardService = require("../services/standard-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")

const createStandard = async (req, res) => {
    try {
        const { name, description, dailyUploads } = req.body;

        const reply = await standardService.createStandard({ name, description, dailyUploads });

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
        const { standardId, name, description, dailyUploads } = req.body;

        const reply = await standardService.updateStandard({ standardId, name, description, dailyUploads });

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

const getAllSummarizedStandards = async (req, res) => {
    try {
        const reply = await standardService.getAllSummarizedStandards();

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

const deleteStandards = async (req, res) => {
    try {
        const reply = await standardService.deleteStandards();

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
}

const getSummarizedStandard = async (req, res) => {
    try {
        const { standardid } = req.headers;

        const reply = await standardService.getSummarizedStandard({ standardId: standardid });

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
    getAllSummarizedStandards,
    deleteStandards,
    getSummarizedStandard
};
