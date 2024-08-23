const { Sequelize, Op } = require("sequelize");
const { logger } = require("../Logs/logger.js");
// @ts-ignore
const { sequelize,Standard, DailyUpload, Resource, Video, AssessmentResourcesDetail, ClassroomCourses, Classroom, Topic, TopicDailyUpload } = require("../models/index.js");
const { CLASSROOM_STATUS } = require("../utils/enumTypes.js");

const createStandard = async ({ name, description, topics, dailyUploads }) => {
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

        const createdTopics = await Promise.all(topics.map(topic => 
            Topic.create({ name: topic.name, description: topic.description, standardId: createdStandard.id }, { transaction })
        ));

        const topicIdMap = createdTopics.reduce((map, topic) => {
            map[topic.name] = topic.id;
            return map;
        }, {});

        const dailyUploadPromises = dailyUploads.map(async upload => {
            const { topicName, ...uploadData } = upload;
            const createdDailyUpload = await DailyUpload.create({ ...uploadData, standardId: createdStandard.id }, { transaction });

            // Populate TopicDailyUpload table
            const topicDailyUploadPromises = topicName.map(async topic => {
                const topicId = topicIdMap[topic];
                if (topicId && createdDailyUpload.id) {
                    await TopicDailyUpload.create({ topicId, dailyUploadId: createdDailyUpload.id }, { transaction });
                }
            });
            await Promise.all(topicDailyUploadPromises);

            return createdDailyUpload;
        });

        const createdDailyUploads = await Promise.all(dailyUploadPromises);

        await transaction.commit();

        const standard = {
            ...createdStandard.toJSON(),
            dailyUploads: createdDailyUploads
        };

        return { code: 200, data: standard };
    } catch (error) {
        await transaction.rollback();
        logger.error(error?.message || 'An error occurred while creating the standard');
        return { code: 500 };
    }
};

const updateStandard = async ({ standardId, name, description, topics, dailyUploads }) => {
    const transaction = await sequelize.transaction();
    try {
        const standard = await Standard.findByPk(standardId, { transaction });
        if (!standard) {
            await transaction.rollback();
            return { code: 404 };
        }

        if (topics) {
            const existingTopics = await Topic.findAll({
                where: { standardId: standardId },
                transaction
            });

            const existingTopicsMap = new Map(existingTopics.map(topic => [topic.name, topic]));

            const newTopicsMap = new Map(topics.map(topic => [topic.name, topic]));

            const topicsToDelete = Array.from(existingTopicsMap.keys()).filter(name => !newTopicsMap.has(name));
            const topicsToUpdate = Array.from(existingTopicsMap.keys()).filter(name => newTopicsMap.has(name));
            const topicsToCreate = Array.from(newTopicsMap.keys()).filter(name => !existingTopicsMap.has(name));

            await Promise.all(topicsToDelete.map(async name => {
                const topicToDelete = existingTopicsMap.get(name);
                await topicToDelete.destroy({ transaction });
            }));

            await Promise.all(topicsToUpdate.map(async name => {
                const existingTopic = existingTopicsMap.get(name);
                const newTopic = newTopicsMap.get(name);
                if (JSON.stringify(existingTopic.toJSON()) !== JSON.stringify(newTopic)) {
                    await existingTopic.update(newTopic, { transaction });
                }
            }));

            await Topic.bulkCreate(
                topicsToCreate.map(name => newTopicsMap.get(name)),
                { transaction }
            );
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

            const oldDailyUploads = await DailyUpload.findAll({
                where: { 
                    standardId: standardId, 
                }, 
                transaction
            });

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
                const { topicName, ...newUploadWithoutTopicName } = newUpload.toJSON();
    
                // Check if any fields have changed that need updating
                if (JSON.stringify(oldUpload.toJSON()) !== JSON.stringify(newUploadWithoutTopicName)) {
                    await oldUpload.update(newUploadWithoutTopicName, { transaction });
                }

                const existingTopicDailyUploads = await TopicDailyUpload.findAll({
                    where: { dailyUploadId: id },
                    include: [{ model: Topic, attributes: ['name'] }],
                    transaction
                });

                const existingTopicDailyUploadsMap = new Map(existingTopicDailyUploads.map(tdu => [tdu.Topic.name, tdu]));

                const newTopicTopicDailyUploadsMap = new Map(topicName.map(topic => [topic, topic]));

                const topicDailyUploadsToDelete = Array.from(existingTopicDailyUploadsMap.keys()).filter(name => !newTopicTopicDailyUploadsMap.has(name));
                const topicDailyUploadsToCreate = Array.from(newTopicTopicDailyUploadsMap.keys()).filter(name => !existingTopicDailyUploadsMap.has(name));

                // Delete old topic associations
                await Promise.all(topicDailyUploadsToDelete.map(async name => {
                    const topicToDelete = existingTopicDailyUploadsMap.get(name);
                    await topicToDelete.destroy({ transaction });
                }));

                // Create new topic associations
                await Promise.all(topicDailyUploadsToCreate.map(async name => {
                    const topic = await Topic.findOne({
                        where: { name, standardId: standardId },
                        transaction
                    });
                    if (topic) {
                        await TopicDailyUpload.create({
                            topicId: topic.id,
                            dailyUploadId: id
                        }, { transaction });
                    }
                }));
            }));

            // Handle resources to delete
            await Promise.all(resourcesToDelete.map(async id => {
                const oldUpload = oldUploadsMap.get(id);
                await oldUpload.destroy({ transaction });
            }));

            // Create a map for new daily uploads excluding topicName
            const newUploadsMapWithoutTopicName = new Map(
                dailyUploads.map(upload => {
                    const { topicName, ...uploadWithoutTopicName } = upload;
                    return [upload.resourceId, uploadWithoutTopicName];
                })
            );
            
            // Handle resources to create
            const newDailyUploads = await DailyUpload.bulkCreate(
                resourcesToCreate.map(id => ({ ...newUploadsMapWithoutTopicName.get(id), standardId: standard.id })),
                { transaction }
            );

            // After creating new DailyUploads, create TopicDailyUpload entries
            await Promise.all(
                newDailyUploads.map(async dailyUpload => {
                    const { topicName, id } = dailyUpload.toJSON(); // Extract topic names and dailyUpload id

                    // Create TopicDailyUpload entries for each topic
                    await Promise.all(
                        topicName.map(async topic => {
                            // Find the Topic associated with the name
                            const foundTopic = await Topic.findOne({
                                where: {
                                    name: topic,
                                    standardId: standard.id
                                },
                                transaction
                            });

                            if (foundTopic) {
                                // Create TopicDailyUpload record
                                await TopicDailyUpload.create({
                                    topicId: foundTopic.id,
                                    dailyUploadId: id
                                }, { transaction });
                            }
                        })
                    );
                })
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
        const existingStandard = await Standard.findByPk(standardId);
        if (!existingStandard) {
            return { code: 404, message: 'Standard not found' };
        }

        const standard = await Standard.findByPk(standardId, {
            include: {
                model: Topic,
                attributes: ['id', 'name', 'description'],
                include: {
                    model: TopicDailyUpload,
                    attributes: ['id'],
                    include: {
                        model: DailyUpload,
                        attributes: ['accessibleDay', 'weightage'],
                        include: {
                            model: Resource,
                            as: 'resource',
                            attributes: ['id', 'name', 'type', 'topic', 'url'],
                            include: [{
                                model: Video,
                                as: 'video',
                                attributes: ['id']
                            }, {
                                model: AssessmentResourcesDetail,
                                as: 'AssessmentResourcesDetail',
                                attributes: ['id', 'totalMarks', 'deadline']
                            }]
                        }
                    }
                }
            }
        });

        if (!standard) {
            return { code: 404, message: 'Topic or Daily Upload Resource not found' };
        }

        const topicsDescriptions = standard.Topics.map(topic => ({
            topicName: topic.name,
            description: topic.description
        }));

        // Transform the daily uploads by day
        const uploadsByDay = {};

        standard.Topics.forEach(topic => {
            topic.TopicDailyUploads.forEach(({ DailyUpload: dailyUpload }) => {
                const day = dailyUpload.accessibleDay;

                if (!uploadsByDay[day]) {
                    uploadsByDay[day] = { topicName: new Set(), resources: [] };
                }

                // Add the topic name to the Set to ensure uniqueness
                uploadsByDay[day].topicName.add(topic.name);

                if (dailyUpload.resource) {
                    const existingResourceIndex = uploadsByDay[day].resources.findIndex(
                        item => item.resource.id === dailyUpload.resource.id
                    );

                    if (existingResourceIndex === -1) {
                        // Resource not found, add it
                        uploadsByDay[day].resources.push({
                            resource: dailyUpload.resource,
                            weightage: dailyUpload.weightage
                        });
                    }
                }
            });
        });

        const transformedDailyUploads = Object.keys(uploadsByDay).sort().map(day => ({
            day: parseInt(day, 10),
            topicName: Array.from(uploadsByDay[day].topicName).map(name => ({ value: name })),
            topics: uploadsByDay[day].resources.map(({ resource, weightage }) => ({
                resourceId: resource.id,
                name: resource.name,
                type: resource.type,
                topic: resource.topic,
                videoId: resource.video ? resource.video.id : null,
                weightage: weightage || 0,
                deadline: resource.AssessmentResourcesDetail ? resource.AssessmentResourcesDetail.deadline : null,
                totalMarks: resource.AssessmentResourcesDetail ? resource.AssessmentResourcesDetail.totalMarks : null,
                URL: resource.url
            }))
        }));

        const result = {
            name: standard.name,
            description: standard.description,
            dailyUploads: transformedDailyUploads,
            topicsDescriptions: topicsDescriptions,
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
                        SELECT COUNT(*)
                        FROM "Topics"
                        WHERE "Topics"."standardId" = "Standard"."id"
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
                        SELECT COUNT(*)
                        FROM "Topics"
                        WHERE "Topics"."standardId" = "Standard"."id"
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
        const existingStandard = await Standard.findByPk(standardId);
        if (!existingStandard) {
            return { code: 404, message: 'Standard not found' };
        }

        const standard = await Standard.findByPk(standardId, {
            include: [{
                model: Topic,
                attributes: ['id', 'name', 'description'],
                include: {
                    model: TopicDailyUpload,
                    attributes: ['id'],
                    include: {
                        model: DailyUpload,
                        attributes: ['accessibleDay', 'weightage'],
                        include: {
                            model: Resource,
                            as: 'resource',
                            attributes: ['id', 'name', 'type', 'topic', 'url'],
                            include: [{
                                model: Video,
                                as: 'video',
                                attributes: ['id']
                            }, {
                                model: AssessmentResourcesDetail,
                                as: 'AssessmentResourcesDetail',
                                attributes: ['id', 'totalMarks', 'deadline']
                            }]
                        }
                    }
                }
            }]
        });

        if (!standard) {
            return { code: 404, message: 'Topic or Daily Upload Resource not found' };
        }

        const topicResourceCounts = {};
        let totalVideoCount = 0;
        let totalNonVideoCount = 0;

        standard.Topics.forEach(topic => {
            const topicName = topic.name;
            if (!topicResourceCounts[topicName]) {
                topicResourceCounts[topicName] = { videoCount: 0, nonVideoCount: 0 };
            }

            topic.TopicDailyUploads.forEach(topicDailyUpload => {
                const { DailyUpload } = topicDailyUpload;
                if (DailyUpload.resource.video) {
                    topicResourceCounts[topicName].videoCount++;
                    totalVideoCount++;
                } else {
                    topicResourceCounts[topicName].nonVideoCount++;
                    totalNonVideoCount++;
                }
            });
        });

        const topicResourceCountsArray = Object.entries(topicResourceCounts).map(([topicName, counts]) => ({
            topicName,
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
        console.error(error);
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
            include: {
                model: Topic,
                where: { name: topicName },
                attributes: ['id', 'name', 'description'],
                include: {
                    model: TopicDailyUpload,
                    attributes: ['id'],
                    include: {
                        model: DailyUpload,
                        attributes: ['accessibleDay', 'weightage'],
                        include: {
                            model: Resource,
                            as: 'resource',
                            attributes: ['id', 'name', 'type', 'topic', 'url'],
                            include: [{
                                model: Video,
                                as: 'video',
                                attributes: ['id']
                            }, {
                                model: AssessmentResourcesDetail,
                                as: 'AssessmentResourcesDetail',
                                attributes: ['id', 'totalMarks', 'deadline']
                            }]
                        }
                    }
                }
            }
        });

        if (!standard) {
            return { code: 404, message: 'Topic or Daily Upload Resource not found' };
        }

        const topic = standard.Topics[0];

        // Transform the daily uploads by day
        const uploadsByDay = topic.TopicDailyUploads.reduce((result, topicDailyUpload) => {
            const { DailyUpload: dailyUpload } = topicDailyUpload;
            const day = dailyUpload.accessibleDay;

            if (!result[day]) {
                result[day] = { topicName: topic.name, resources: [] };
            }

            if (dailyUpload.resource) {
                result[day].resources.push({ resource: dailyUpload.resource, weightage: dailyUpload.weightage });
            }
            return result;
        }, {});

        const transformedDailyUploads = Object.keys(uploadsByDay).sort().map(day => ({
            day: parseInt(day, 10),
            topicName: topicName,
            topics: uploadsByDay[day].resources.map(({ resource, weightage }) => ({
                resourceId: resource.id,
                name: resource.name,
                type: resource.type,
                topic: resource.topic,
                videoId: resource.video ? resource.video.id : null,
                weightage: weightage || 0,
                deadline: resource.AssessmentResourcesDetail ? resource.AssessmentResourcesDetail.deadline : null,
                totalMarks: resource.AssessmentResourcesDetail ? resource.AssessmentResourcesDetail.totalMarks : null,
                URL: resource.url
            }))
        }));

        const result = {
            name: standard.name,
            description: standard.description,
            dailyUploads: transformedDailyUploads,
        };

        return { code: 200, data: result };
    } catch (error) {
        console.log('\n\n\n\n', error)
        logger.error(error?.message || 'An error occurred while fetching the standard');
        return { code: 500 };
    }
};

const getStandardClassroomsAndTeacherClassrooms = async ({ standardId, teacherId }) => {
    try {
        const standard = await Standard.findByPk(standardId);
        if (!standard) {
            return { code: 404, message: 'Standard not found' };
        }

        const classCourses = await ClassroomCourses.findAll({
            where: { 
                standardId 
            },
            attributes: ['id', 'startDate'],
            include: [{
                model: Classroom,
                as: 'classroom',
                attributes: ['id', 'name']
            }]
        }); 

        const transformedClassCourses = classCourses?.map(course => ({
            id: course.id,
            startDate: course.startDate,
            classroomId: course.classroom.id,
            classroomName: course.classroom.name
        }));

        const teacherClassrooms = await Classroom.findAll({
            where: { 
                teacherId: teacherId,
                status: CLASSROOM_STATUS.ACTIVE
            },
            attributes: ['id', 'name']
        });

        const options = teacherClassrooms?.map(classroom => {
            return { label: classroom.id, value: classroom.name };
        });

        return { 
            code: 200, 
            data: { 
                standard, 
                classCourses: transformedClassCourses || [], 
                options 
            } 
        };
    }
    catch (error) {
        console.log('\n\n\n\n', error)
        logger.error(error?.message || 'An error occurred while fetching the standard classrooms');
        return { code: 500 };
    }
}
module.exports = {
    createStandard,
    updateStandard,
    getStandard,
    getAllSummarizedStandards,
    deleteStandard,
    getSummarizedStandard,
    getStandardTopics,
    getTopicResources,
    getStandardClassroomsAndTeacherClassrooms
};