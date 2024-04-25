const { Sequelize } = require("sequelize");
const { logger } = require("../Logs/logger.js");
const { Resource, Video } = require("../models/index.js");
const { RESOURCE_TYPES } = require("../utils/enumTypes.js");

const createResource = async ({ name, url, type, topic, thumbnailURL }) => {
    try {

        const resource = await Resource.create({
            name,
            url,
            type,
            topic,
        });

        if (type === RESOURCE_TYPES.VIDEO) {
            
            const videoAttributes = await Video.create({
                resourceId: resource.id,
                thumbnailURL,
            })
    
            return { code: 200, data: {resource, videoAttributes: {...videoAttributes.dataValues}} };
        }

        return { code: 200, data: resource };

    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const deleteResource = async ({resourceID}) => {
    try {
        const result = await Resource.destroy({
            where: { id: resourceID }
        });

        if (result) {
            return { code: 200, message: 'Resource deleted successfully' };
        } else {
            return { code: 404 };
        }
    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const getResources = async ({ topic, type, page, limit, orderBy, sortBy }) => {
    try {
        const offset = (page - 1) * limit;

        const queryOptions = {
            where: {},
            offset,
            limit
        };

        if (type) {
            queryOptions.where.type = type;
        }

        if (topic) {
            queryOptions.where.topic = topic;
        }

        if (orderBy && sortBy) {
            queryOptions.order = [[orderBy, sortBy]];
        }

        const resources = await Resource.findAndCountAll(queryOptions);

        const res = {
            totalPages: Math.ceil(resources.count / limit),
            totalResources: resources.count,
            resources: resources.rows,
        }

        return { code: 200, data: res };
    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const getResourcesCount = async ({ topic }) => {
    try {
        // Define an object with all resource types set to 0
        const resourceCountsObject = {
            [RESOURCE_TYPES.SLIDESHOW]: 0,
            [RESOURCE_TYPES.VIDEO]: 0,
            [RESOURCE_TYPES.WORKSHEET]: 0,
            [RESOURCE_TYPES.EXIT_TICKET_TEST]: 0,
            [RESOURCE_TYPES.QUIZ]: 0,
            [RESOURCE_TYPES.ASSIGNMENT]: 0
        };

        // Get the individual counts of resources by type for a specific topic
        const resourceCounts = await Resource.findAll({
            attributes: ['type', [Sequelize.fn('COUNT', 'type'), 'count']],
            where: { topic }, // Add the where clause
            group: ['type'],
            raw: true,
        });

        // Update the resourceCountsObject with the actual counts
        resourceCounts.forEach(item => {
            resourceCountsObject[item.type] = item.count;
        });

        // Get the total count of all resources for a specific topic
        const totalCount = await Resource.count({ where: { topic } }); // Add the where clause

        const res = {
            slideshowCount: resourceCountsObject[RESOURCE_TYPES.SLIDESHOW],
            videoCount: resourceCountsObject[RESOURCE_TYPES.VIDEO],
            worksheetCount: resourceCountsObject[RESOURCE_TYPES.WORKSHEET],
            exitTicketTestCount: resourceCountsObject[RESOURCE_TYPES.EXIT_TICKET_TEST],
            quizCount: resourceCountsObject[RESOURCE_TYPES.QUIZ],
            assignmentCount: resourceCountsObject[RESOURCE_TYPES.ASSIGNMENT],
            totalCount,
        };

        return { code: 200, data: res };
    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const updateResource = async ({ resourceId, name, type, topic }) => {
    try {
        const resource = await Resource.findOne({where: {id: resourceId}});

        if (!resource) {
            return { code: 404 };
        }

        await resource.update({ name, type, topic });

        resource.save();

        return { code: 200, data: resource };
    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const getResource = async ({resourceID}) => {
    try {
        const resource = await Resource.findOne({
            where: { id: resourceID }
        });

        if (resource) {
            return { code: 200, data: resource };
        } else {
            return { code: 404 };
        }
    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

module.exports = {
    createResource,
    deleteResource,
    getResources,
    getResourcesCount,
    getResource,
    updateResource,
};
