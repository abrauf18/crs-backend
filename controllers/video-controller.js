const videoService = require("../services/video-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")

const getAllVideos = async (req, res) => {
    try {

        const reply = await videoService.getAllVideos();

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

const createVideo = async (req, res) => {
    try {
        const { resourceId, thumbnailURL, topics } = req.body;
        
        const reply = await videoService.createVideo({ resourceId, thumbnailURL, topics });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, "Resource not found");
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

const createMinimalVideo = async (req, res) => {
    try {
        const { resourceId, thumbnailURL } = req.body;
        
        const reply = await videoService.createMinimalVideo({ resourceId, thumbnailURL });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, "Resource not found");
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

const addTopicsInVideo = async (req, res) => {
    try {
        const { videoId, topics } = req.body;
        
        const reply = await videoService.addTopicsInVideo({ videoId, topics });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, "Resource not found");
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

const deleteVideo = async (req, res) => {
    try {
        const { videoid } = req.headers;
        
        const reply = await videoService.deleteVideo({ videoId: videoid });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, "Video not found");
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

const getVideo = async (req, res) => {
    try {
        const { videoid } = req.headers;
        
        const reply = await videoService.getVideo({ videoId: videoid });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {
            return handleErrorResponse(res, 404, "Video not found");
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
    getAllVideos,
    createVideo,
    addTopicsInVideo,
    deleteVideo,
    getVideo,
    createMinimalVideo
};
