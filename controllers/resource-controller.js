const resourceService = require("../services/resource-service.js");
const { handleInternalServerError, handleSuccessResponse, handleErrorResponse } = require("../utils/response-handlers.js")

const createResource = async (req, res) => {
    try {
        const { name, url, type, topic, thumbnailURL = '', duration = '00:00:00' } = req.body;

        const reply = await resourceService.createResource({ name, url, type, topic, thumbnailURL, duration });

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

const deleteResource = async (req, res) => {
    try {
        const { resourceid } = req.headers;
  
        const reply = await resourceService.deleteResource({ resourceID: resourceid });
    
        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {  
            return handleErrorResponse(res, 404, 'Resource not found')
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

const getResources = async (req, res) => {
    try {
        const { topic, type, page, limit, orderBy, sortBy } = req.query;

        const resources = await resourceService.getResources({ topic, type, page, limit, orderBy, sortBy });

        if (resources.code == 200) {
            return handleSuccessResponse(res, 200, resources.data);
        } else {
            return handleInternalServerError(res);
        }
    } catch (error) {
        return handleInternalServerError(res);
    }
};

const getResource = async (req, res) => {
    try {
        const { resourceid } = req.headers;
  
        const reply = await resourceService.getResource({ resourceID: resourceid });
    
        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {  
            return handleErrorResponse(res, 404, 'Resource not found')
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

const getResourcesCount = async (req, res) => {
    try {
        const { topic } = req.headers;

        const resources = await resourceService.getResourcesCount({topic});

        if (resources.code == 200) {
            return handleSuccessResponse(res, 200, resources.data);
        } else {
            return handleInternalServerError(res);
        }
    } catch (error) {
        return handleInternalServerError(res);
    }
};

const updateResource = async (req, res) => {
    try {
        const { resourceId, name, type, topic } = req.body

        const reply = await resourceService.updateResource({ resourceId, name, type, topic });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {  
            return handleErrorResponse(res, 404, 'Resource not found')
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};
const getall = async (req, res) => {
    try {
        const reply = await resourceService.getall();

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

const getResourcesByType = async (req, res) => {
    try {
        const { resourcetype } = req.headers;

        const reply = await resourceService.getResourcesByType({ resourceType: resourcetype });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {  
            return handleErrorResponse(res, 404, 'Resource not found')
        }
        else {
            return handleInternalServerError(res);
        }
    }
    catch (error) {
        return handleInternalServerError(res);
    }
};

const getResourcesByName = async (req, res) => {
    try {
        const { resourcename } = req.headers;

        const reply = await resourceService.getResourcesByName({ resourceName: resourcename });

        if (reply.code == 200) {
            return handleSuccessResponse(res, 200, reply.data);
        }
        else if (reply.code == 404) {  
            return handleErrorResponse(res, 404, 'Resource not found')
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
    createResource,
    deleteResource,
    getResources,
    getResource,
    getResourcesCount,
    updateResource,
    getall,
    getResourcesByType,
    getResourcesByName,
};
