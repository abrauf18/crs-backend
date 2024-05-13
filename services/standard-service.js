const { Sequelize } = require("sequelize");
const { logger } = require("../Logs/logger.js");
const { Standard, DailyUpload, Resource, Video } = require("../models/index.js");
const { RESOURCE_TYPES } = require("../utils/enumTypes.js");

const createStandard = async ({ name, description, dailyUploads }) => {
    try {
        const dates = dailyUploads.map(upload => new Date(upload.accessDate));
        const minDate = new Date(Math.min.apply(null, dates));
        const maxDate = new Date(Math.max.apply(null, dates));

        const diffTime = Math.abs(maxDate - minDate);
        const courseLength = (diffTime / (1000 * 60 * 60 * 24 * 7)).toFixed(1) + " week";

        const createdStandard = await Standard.create({name, description, courseLength});
        
        const createdDailyUploads = await Promise.all(dailyUploads.map(upload => {
            return DailyUpload.create({ ...upload, standardId: createdStandard.id });
        }));
    
        const standard = {
            ...createdStandard.toJSON(),
            dailyUploads: createdDailyUploads.map(upload => upload.toJSON())
        };

        return { code: 200, data: standard };
    } catch (error) {
        logger.error(error?.message || 'An error occurred while updating the standard');
        return { code: 500 };
    }
};

const updateStandard = async ({ standardId, name, description, dailyUploads }) => {
    try {
        const standard = await Standard.findByPk(standardId);
        if (!standard) {
            return { code: 404 };
        }

        if (name) {
            await standard.update( {name} );
        }

        if (description) {
            await standard.update( {description} );
        }

        let newDailyUploads = [];
        if (dailyUploads) {
            const oldDailyUploads = await standard.getDailyUploads();

            for (let dailyUpload of oldDailyUploads) {
                await dailyUpload.destroy();
            }

            // newDailyUploads = await Promise.all(dailyUploads.map(upload => {
            //     return DailyUpload.create({ ...upload, standardId: standard.id });
            // }));
            newDailyUploads = await DailyUpload.bulkCreate(
                dailyUploads.map((upload) => ({ ...upload, standardId: standard.id }))
            );

            const dates = dailyUploads.map(upload => new Date(upload.accessDate));
            const minDate = new Date(Math.min.apply(null, dates));
            const maxDate = new Date(Math.max.apply(null, dates));

            const diffTime = Math.abs(maxDate - minDate);
            const courseLength = (diffTime / (1000 * 60 * 60 * 24 * 7)).toFixed(1) + " week";
            await standard.update( {courseLength} );

            // await standard.setDailyUploads(newDailyUploads);
        }

        const updatedStandard = {
            ...standard.toJSON(),
            dailyUploads: newDailyUploads.map(upload => upload.toJSON())
        };

        return { code: 200, data: updatedStandard };
    } catch (error) {
        console.log('\n\n\n\n', error)
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
                attributes: ['accessDate'],
                include: [{
                    model: Resource,
                    as: 'resource',
                    attributes: ['id', 'name', 'type', 'topic'],
                    include: [{
                        model: Video,
                        as: 'video',
                        attributes: ['id']
                    }]
                }]
            }]
        });

        if (!standard) {
            return { code: 404, message: 'Standard not found' };
        }

        // Transform the data
        const uploadsByDate = standard.dailyUploads.reduce((result, upload) => {
            const date = upload.accessDate;
            if (!result[date]) {
                result[date] = [];
            }
            if (upload.resource) {
                result[date].push(upload.resource);
            }
            return result;
        }, {});

        // const transformedDailyUploads = Object.keys(uploadsByDate).sort().map(date => ({
        //     accessDate: date,
        //     resources: uploadsByDate[date]
        // }));

        // as required on frontend
        const transformedDailyUploads = Object.keys(uploadsByDate).sort().map(date => ({
            date: date,
            topics: uploadsByDate[date].map(resource => ({
                resourceId: resource.id,
                name: resource.name,
                type: resource.type,
                topic: resource.topic,
                videoId: resource.video ? resource.video.id : null
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
                ]
            ]
        });

        return { code: 200, data: {standardsCount: totalStandards, allStandards: standards} };

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

module.exports = {
  createStandard,
  updateStandard,
  getStandard,
  getAllSummarizedStandards
};