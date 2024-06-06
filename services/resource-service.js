const { Sequelize, Op } = require("sequelize");
const { logger } = require("../Logs/logger.js");
// @ts-ignore
const { Resource, Video, AssessmentResourcesDetail } = require("../models/index.js");
const { RESOURCE_TYPES } = require("../utils/enumTypes.js");

const isAssessmentResource = (type) => {
    return type === RESOURCE_TYPES.ASSIGNMENT || type === RESOURCE_TYPES.EXIT_TICKET_TEST || type === RESOURCE_TYPES.QUIZ || type === RESOURCE_TYPES.WORKSHEET;
};

const createResource = async ({ name, url, type, topic, thumbnailURL, duration, totalMarks, deadline }) => {
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
                duration
            })
    
            return { code: 200, data: {resource, videoAttributes: {...videoAttributes.dataValues}} };
        }
        let resourceDetails = resource.get();
        if (isAssessmentResource(type)) {
            const assessmentAttributes = await AssessmentResourcesDetail.create({
                resourceId: resource.id,
                totalMarks: totalMarks,
                numberOfQuestions: 1,
                deadline: deadline
            })
            resourceDetails = {...resourceDetails, totalMarks: assessmentAttributes.totalMarks, numberOfQuestions: assessmentAttributes.numberOfQuestions, deadline: assessmentAttributes.deadline};
        }

        return { code: 200, data: 
            {resource: { ...resourceDetails }
        }};

    } catch (error) {
        console.log('\n\n\n', error)
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const deleteResource = async ({resourceID}) => {
    try {
        const resource = await Resource.findOne({
            where: { id: resourceID },
            include: {
                model: AssessmentResourcesDetail,
                as: 'AssessmentResourcesDetail'
            }
        });

        if (!resource) {
            return { code: 404 };
        }

        if (isAssessmentResource(resource.type)) {
            if (resource.AssessmentResourcesDetail) {
                await resource.AssessmentResourcesDetail.destroy();
            }
        }

        await resource.destroy();

        return { code: 200, message: 'Resource deleted successfully' };
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
            limit,
            include: [
                {
                    model: Video,
                    as: 'video',
                    attributes: ['id']
                },
                {
                    model: AssessmentResourcesDetail,
                    as: 'AssessmentResourcesDetail'
                }
            ],
        };

        if (type) {
            queryOptions.where.type = type;
        }

        if (topic) {
            queryOptions.where.topic = { [Op.iLike]: topic };
        }

        if (orderBy && sortBy) {
            queryOptions.order = [[orderBy, sortBy]];
        } else {
            queryOptions.order = [['id', 'ASC']];
        }

        const resources = await Resource.findAndCountAll(queryOptions);

        const res = {
            totalPages: Math.ceil(resources.count / limit),
            totalResources: resources.count,
            resources: resources.rows.map(resource => {
                const { video, AssessmentResourcesDetail, ...resourceData } = resource.get();
                return {
                    ...resourceData,
                    videoId: video?.id,
                    totalMarks: AssessmentResourcesDetail?.totalMarks,
                };
            })
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
            where: { topic: { [Op.iLike]: topic } }, // Add the where clause
            group: ['type'],
            raw: true,
        });

        // Update the resourceCountsObject with the actual counts
        resourceCounts.forEach(item => {
            resourceCountsObject[item.type] = item.count;
        });

        // Get the total count of all resources for a specific topic
        const totalCount = await Resource.count({ where: { topic: {[Op.iLike]: topic} } }); // Add the where clause

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

const updateResource = async ({ resourceId, name, type, topic, totalMarks }) => {
    try {
        const resource = await Resource.findOne({
            where: { id: resourceId },
            include: isAssessmentResource(type) ? [{
                model: AssessmentResourcesDetail,
                as: 'AssessmentResourcesDetail'
            }] : []
        });

        if (!resource) {
            return { code: 404 };
        }

        if (isAssessmentResource(resource.type)) {
            const assessmentResourceDetail = resource.AssessmentResourcesDetail;
            if (!assessmentResourceDetail) {
                return { code: 404, message: 'AssessmentResourcesDetail not found' };
            }
            await assessmentResourceDetail.update({ totalMarks });
        }

        await resource.update({ name, type, topic });

        return { code: 200, data: resource };
    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const getResource = async ({resourceID}) => {
    try {
        const resource = await Resource.findOne({
            where: { id: resourceID },
        });
        if (!resource) {
            return { code: 404 };
        }
        const simplifiedResource = resource.get();
        if (isAssessmentResource(resource.type)) {
            const assessmentResourcesDetail = await resource.getAssessmentResourcesDetail();
            return { 
                code: 200, 
                data: {
                    ...simplifiedResource,
                    totalMarks: assessmentResourcesDetail?.totalMarks || 0,
                } 
            };        
        }
        return { code: 200, data: resource };
    } catch (error) {
        console.log('\n\n\n', error);
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const getResourcesByType = async ({ resourceType }) => {
    try {
        const resources = await Resource.findAll({
            where: { type: resourceType },
            include: [
                {
                    model: Video,
                    as: 'video',
                    attributes: ['thumbnailURL'],
                    required: false
                },
            ],
        });

        const transformedResources = resources.map(resource => {
            const { video, createdAt, updatedAt, ...resourceData } = resource.get();
            return {
                ...resourceData,
                thumbnail: video?.thumbnailURL,
            };
        });

        return { code: 200, data: transformedResources };
    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const getResourcesByName = async ({ resourceName, resourceType }) => {
    try {
        const resources = await Resource.findAll({
            where: {
                name: { [Op.iLike]: '%' + resourceName + '%' },
                type: resourceType,
            },
            include: [
                {
                    model: Video,
                    as: 'video',
                    attributes: ['thumbnailURL'],
                    required: false
                },
            ],
        });
        
        const transformedResources = resources.map(resource => {
            const { video, createdAt, updatedAt, ...resourceData } = resource.get();
            return {
                ...resourceData,
                thumbnail: video?.thumbnailURL,
            };
        });

        return { code: 200, data: transformedResources };
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
    getResourcesByType,
    getResourcesByName
};
