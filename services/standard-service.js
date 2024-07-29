const { Sequelize } = require("sequelize");
const { logger } = require("../Logs/logger.js");
// @ts-ignore
const { sequelize,Standard, DailyUpload, Resource, Video, AssessmentResourcesDetail } = require("../models/index.js");

const createStandard = async ({ name, description, dailyUploads }) => {
    const transaction = await sequelize.transaction();
    try {
        const totalWeightage = dailyUploads.reduce((acc, curr) => acc + Number(curr.weightage), 0);
        if (totalWeightage !== 100) {
            await transaction.rollback();
            return { code: 400, message: `The sum of weightages is ${totalWeightage}, it must be 100` };
        }

        const resourceIdCount = {};
        const duplicates = [];
        dailyUploads.forEach(upload => {
            const { resourceId } = upload;
            if (resourceIdCount[resourceId]) {
                resourceIdCount[resourceId]++;
                if (resourceIdCount[resourceId] === 2) {
                    duplicates.push(resourceId);
                }
            } else {
                resourceIdCount[resourceId] = 1;
            }
        });

        if (duplicates.length > 0) {
            const duplicateResource = await Promise.all(duplicates.map(async resourceId => {
                const foundResource = await Resource.findByPk(resourceId, { transaction });
                return foundResource.name;
            }));
            await transaction.rollback();
            return { code: 409, message: `The following resources already exist in the standard: ${duplicateResource.join(', ')}`};
        }

        const days = dailyUploads.map(upload => upload.accessibleDay);
        const minDay = Math.min(...days);
        const maxDay = Math.max(...days);

        const dayDiff = Math.abs(maxDay - minDay);
        const courseLength = (dayDiff / 7).toFixed(1) + " week";

        const createdStandard = await Standard.create({ name, description, courseLength }, { transaction });

        const createdDailyUploads = await Promise.all(dailyUploads.map(upload => {
            return DailyUpload.create({ ...upload, standardId: createdStandard.id }, { transaction });
        }));

        await transaction.commit();

        const standard = {
            ...createdStandard.toJSON(),
            dailyUploads: createdDailyUploads.map(upload => upload.toJSON())
        };

        return { code: 200, data: standard };
    } catch (error) {
        await transaction.rollback();
        logger.error(error?.message || 'An error occurred while creating the standard');
        return { code: 500 };
    }
};

const updateStandard = async ({ standardId, name, description, dailyUploads }) => {
    const transaction = await sequelize.transaction();
    try {
        const standard = await Standard.findByPk(standardId, { transaction });
        if (!standard) {
            await transaction.rollback();
            return { code: 404 };
        }

        let newDailyUploads = [];
        if (dailyUploads) {
            const totalWeightage = dailyUploads.reduce((acc, curr) => acc + Number(curr.weightage), 0);
            if (totalWeightage !== 100) {
                await transaction.rollback();
                return { code: 400, message: `The sum of weightages is ${totalWeightage}, it must be 100` };
            }

            const resourceIdCount = {};
            const duplicates = [];
            dailyUploads.forEach(upload => {
                const { resourceId } = upload;
                if (resourceIdCount[resourceId]) {
                    resourceIdCount[resourceId]++;
                    if (resourceIdCount[resourceId] === 2) {
                        duplicates.push(resourceId);
                    }
                } else {
                    resourceIdCount[resourceId] = 1;
                }
            });

            if (duplicates.length > 0) {
                const duplicateResource = await Promise.all(duplicates.map(async resourceId => {
                    const foundResource = await Resource.findByPk(resourceId, { transaction });
                    return foundResource.name;
                }));
                await transaction.rollback();
                return { code: 409, message: `The following resources already exist in the standard: ${duplicateResource.join(', ')}`};
            }

            const oldDailyUploads = await standard.getDailyUploads({ transaction });

            // Create maps for quick lookup
            const oldUploadsMap = new Map(oldDailyUploads.map(upload => [upload.resourceId, upload]));
            const newUploadsMap = new Map(dailyUploads.map(upload => [upload.resourceId, upload]));

            // Identify resources to delete and update
            const resourcesToDelete = Array.from(oldUploadsMap.keys()).filter(id => !newUploadsMap.has(id));
            const resourcesToUpdate = Array.from(oldUploadsMap.keys()).filter(id => newUploadsMap.has(id));
            const resourcesToCreate = Array.from(newUploadsMap.keys()).filter(id => !oldUploadsMap.has(id));

            // Handle resources to update
            await Promise.all(resourcesToUpdate.map(async id => {
                const oldUpload = oldUploadsMap.get(id);
                const newUpload = newUploadsMap.get(id);
                // Check if any fields have changed that need updating
                if (JSON.stringify(oldUpload.toJSON()) !== JSON.stringify(newUpload)) {
                    await oldUpload.update(newUpload, { transaction });
                }
            }));

            // Handle resources to delete
            await Promise.all(resourcesToDelete.map(async id => {
                const oldUpload = oldUploadsMap.get(id);
                await oldUpload.destroy({ transaction });
            }));

            // Handle resources to create
            const newDailyUploads = await DailyUpload.bulkCreate(
                resourcesToCreate.map(id => ({ ...newUploadsMap.get(id), standardId: standard.id })),
                { transaction }
            );

            const days = dailyUploads.map(upload => upload.accessibleDay);
            const minDay = Math.min(...days);
            const maxDay = Math.max(...days);

            const dayDiff = Math.abs(maxDay - minDay);
            const courseLength = (dayDiff / 7).toFixed(1) + " week";
            await standard.update({ courseLength }, { transaction });
        }

        if (name) {
            await standard.update({ name }, { transaction });
        }

        if (description) {
            await standard.update({ description }, { transaction });
        }

        await transaction.commit();

        const updatedStandard = {
            ...standard.toJSON(),
            dailyUploads: newDailyUploads.map(upload => upload.toJSON())
        };

        return { code: 200, data: updatedStandard };
    } catch (error) {
        await transaction.rollback();
        logger.error(error?.message || 'An error occurred while updating the standard');
        return { code: 500 };
    }
};

const getStandard = async ({ standardId }) => {
    try {
        const standard = await Standard.findByPk(standardId, {
            include: [{
                model: DailyUpload,
                as: 'dailyUploads',
                attributes: ['accessibleDay', 'weightage', 'topicName'],
                include: [{
                    model: Resource,
                    as: 'resource',
                    attributes: ['id', 'name', 'type', 'topic'],
                    include: [{
                        model: Video,
                        as: 'video',
                        attributes: ['id']
                    }, {
                        model: AssessmentResourcesDetail,
                        as: 'AssessmentResourcesDetail',
                        attributes: ['id', 'totalMarks', 'deadline']
                    }]
                }]
            },]
        });

        if (!standard) {
            return { code: 404, message: 'Standard not found' };
        }

        // Transform the data
        const uploadsByDay = standard.dailyUploads.reduce((result, upload) => {
            const day = upload.accessibleDay;
            if (!result[day]) {
                result[day] = { topicName: upload.topicName, resources: [] };
            }
            if (upload.resource) {
                result[day].resources.push({ resource: upload.resource, weightage: upload.weightage });
            }
            return result;
        }, {});

        const transformedDailyUploads = Object.keys(uploadsByDay).sort().map(day => ({
            accessibleDay: day,
            topicName: uploadsByDay[day].topicName,
            topics: uploadsByDay[day].resources.map(({ resource, weightage }) => ({
                resourceId: resource.id,
                name: resource.name,
                type: resource.type,
                topic: resource.topic,
                videoId: resource.video ? resource.video.id : null,
                weightage: weightage || 0,
                deadline: resource.AssessmentResourcesDetail ? resource.AssessmentResourcesDetail.deadline : null,
                totalMarks: resource.AssessmentResourcesDetail ? resource.AssessmentResourcesDetail.totalMarks : null,
            }))
        }));

        const result = {
            name: standard.name,
            description: standard.description,
            dailyUploads: transformedDailyUploads
        };

        return { code: 200, data: result };
    } catch (error) {
        console.log('\n\n\n\n', error)
        logger.error(error?.message || 'An error occurred while fetching the standard');
        return { code: 500 };
    }
};

const getAllSummarizedStandards = async () => {
    try {
        const totalStandards = await Standard.count();

        const standards = await Standard.findAll({
            attributes: [
                'id',
                'name',
                'courseLength',
                [
                    Sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM "DailyUploads" AS "du"
                        INNER JOIN "Resources" AS "r" ON "du"."resourceId" = "r"."id"
                        WHERE "du"."standardId" = "Standard"."id" AND "r"."type" = 'video'
                    )`),
                    'totalVideoUploads'
                ],
                [
                    Sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM "DailyUploads" AS "du"
                        INNER JOIN "Resources" AS "r" ON "du"."resourceId" = "r"."id"
                        WHERE "du"."standardId" = "Standard"."id" AND "r"."type" != 'video'
                    )`),
                    'totalNonVideoUploads'
                ],
                [
                    Sequelize.literal(`(
                        SELECT COUNT(DISTINCT "du"."topicName")
                        FROM "DailyUploads" AS "du"
                        WHERE "du"."standardId" = "Standard"."id"
                    )`),
                    'topicCount'
                ]
            ]
        });

        return { code: 200, data: { standardsCount: totalStandards, allStandards: standards } };

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting the summarized standards');
        return { code: 500 };
    }
};

// const getAllSummarizedStandards = async () => {
//     try {
//         const totalStandards = await Standard.count();

//         const standards = await Standard.findAll({
//             include: [
//                 {
//                     model: DailyUpload,
//                     as: 'dailyUploads',
//                     include: [
//                         {
//                             model: Resource,
//                             as: 'resource'
//                         }
//                     ]
//                 }
//             ]
//         });

//         const standardSummaries = standards.map(standard => {
//             const dailyUploads = standard.dailyUploads;
//             const resources = dailyUploads.map(upload => upload.resource);
//             const totalVideoUploads = resources.filter(resource => resource.type === RESOURCE_TYPES.VIDEO).length;
//             const totalNonVideoUploads = resources.filter(resource => resource.type !== RESOURCE_TYPES.VIDEO).length;

//             return {
//                 id: standard.id,
//                 name: standard.name,
//                 courseLength: standard.courseLength,
//                 totalVideoUploads,
//                 totalNonVideoUploads
//             };
//         });

//         return { code: 200, data: {standardsCount: totalStandards, allStandards: standardSummaries} };
//     } catch (error) {
//         console.log('\n\n\n\n', error);
//         logger.error(error?.message || 'An error occurred while fetching the summarized standards');
//         return { code: 500 };
//     }
// };

const deleteStandard = async ({ standardId }) => {
    try {
        const exisitingStandard = await Standard.findByPk(standardId);
        if (!exisitingStandard) {
            return { code: 404, message: 'Standard not found' };
        }
        
        await Standard.destroy({ 
            where: {
                id: standardId
            } 
        });
        return { code: 200 };
    } catch (error) {
        logger.error(error?.message || 'An error occurred while deleting the standards');
        return { code: 500 };
    }
};

const getSummarizedStandard = async ({ standardId }) => {
    try {
        const standard = await Standard.findByPk(standardId, {
            attributes: [
                'id',
                'name',
                'courseLength',
                [
                    Sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM "DailyUploads" AS "du"
                        INNER JOIN "Resources" AS "r" ON "du"."resourceId" = "r"."id"
                        WHERE "du"."standardId" = "Standard"."id" AND "r"."type" = 'video'
                    )`),
                    'totalVideoUploads'
                ],
                [
                    Sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM "DailyUploads" AS "du"
                        INNER JOIN "Resources" AS "r" ON "du"."resourceId" = "r"."id"
                        WHERE "du"."standardId" = "Standard"."id" AND "r"."type" != 'video'
                    )`),
                    'totalNonVideoUploads'
                ],
                [
                    Sequelize.literal(`(
                        SELECT COUNT(DISTINCT "du"."topicName")
                        FROM "DailyUploads" AS "du"
                        WHERE "du"."standardId" = "Standard"."id"
                    )`),
                    'topicCount'
                ]
            ]
        });

        return { code: 200, data: standard };

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting the summarized standard');
        return { code: 500 };
    }
}

const getStandardTopics = async ({ standardId }) => {
    try {
        const standard = await Standard.findByPk(standardId, {
            include: [{
                model: DailyUpload,
                as: 'dailyUploads',
                attributes: ['accessDate', 'weightage', 'topicName'],
                include: [{
                    model: Resource,
                    as: 'resource',
                    attributes: ['id', 'name', 'type', 'topic'],
                    include: [{
                        model: Video,
                        as: 'video',
                        attributes: ['id'],
                        required: false,
                    }, {
                        model: AssessmentResourcesDetail,
                        as: 'AssessmentResourcesDetail',
                        attributes: ['id'],
                        required: false,
                    }]
                }]
            },]
        });

        if (!standard) {
            return { code: 404, message: 'Standard not found' };
        }

        const topicResourceCounts = {};
        let totalVideoCount = 0;
        let totalNonVideoCount = 0;

        standard.dailyUploads.forEach(upload => {
            const topicName = upload.topicName;
            if (!topicResourceCounts[topicName]) {
                topicResourceCounts[topicName] = { videoCount: 0, nonVideoCount: 0 };
            }
            if (upload.resource.video) {
                topicResourceCounts[topicName].videoCount++;
                totalVideoCount++;
            } else {
                topicResourceCounts[topicName].nonVideoCount++;
                totalNonVideoCount++;
            }
        });

        // topicResourceCounts['All-Topics'] = { videoCount: totalVideoCount, nonVideoCount: totalNonVideoCount };

        const topicResourceCountsArray = Object.entries(topicResourceCounts).map(([topic, counts]) => ({
            topicName: topic,
            ...counts
        }));

        const totalTopics = topicResourceCountsArray.length;

        return { 
            code: 200, 
            data: {
                name: standard.name,
                totalTopics,
                topicResourceCounts: topicResourceCountsArray
            } 
        };
    } catch (error) {
        console.log('\n\n\n\n', error)
        logger.error(error?.message || 'An error occurred while fetching the standard');
        return { code: 500 };
    }
};

const getTopicResources = async ({ standardId, topicName }) => {
    try {
        const existingStandard = await Standard.findByPk(standardId);
        if (!existingStandard) {
            return { code: 404, message: 'Standard not found' };
        }

        const standard = await Standard.findByPk(standardId, {
            include: [{
                model: DailyUpload,
                as: 'dailyUploads',
                attributes: ['accessDate', 'weightage', 'topicName'],
                where: topicName? { topicName }: {},
                include: [{
                    model: Resource,
                    as: 'resource',
                    attributes: ['id', 'name', 'type', 'topic'],
                    include: [{
                        model: Video,
                        as: 'video',
                        attributes: ['id']
                    }, {
                        model: AssessmentResourcesDetail,
                        as: 'AssessmentResourcesDetail',
                        attributes: ['id', 'totalMarks', 'deadline']
                    }]
                }]
            },]
        });

        if (!standard) {
            return { code: 404, message: 'Topic not found' };
        }

        // Transform the data
        const uploadsByDate = standard.dailyUploads.reduce((result, upload) => {
            const date = upload.accessDate;
            if (!result[date]) {
                result[date] = { topicName: upload.topicName, resources: [] };
            }
            if (upload.resource) {
                result[date].resources.push({ resource: upload.resource, weightage: upload.weightage });
            }
            return result;
        }, {});

        const transformedDailyUploads = Object.keys(uploadsByDate).sort().map(date => ({
            date: date,
            topicName: uploadsByDate[date].topicName,
            topics: uploadsByDate[date].resources.map(({ resource, weightage }) => ({
                resourceId: resource.id,
                name: resource.name,
                type: resource.type,
                topic: resource.topic,
                videoId: resource.video ? resource.video.id : null,
                weightage: weightage || 0,
                deadline: resource.AssessmentResourcesDetail ? resource.AssessmentResourcesDetail.deadline : null,
                totalMarks: resource.AssessmentResourcesDetail ? resource.AssessmentResourcesDetail.totalMarks : null,
            }))
        }));

        const result = {
            name: standard.name,
            description: standard.description,
            dailyUploads: transformedDailyUploads
        };

        return { code: 200, data: result };
    } catch (error) {
        console.log('\n\n\n\n', error)
        logger.error(error?.message || 'An error occurred while fetching the standard');
        return { code: 500 };
    }
};

module.exports = {
    createStandard,
    updateStandard,
    getStandard,
    getAllSummarizedStandards,
    deleteStandard,
    getSummarizedStandard,
    getStandardTopics,
    getTopicResources
};