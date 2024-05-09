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
        // const standards = await Standard.findAll({
        //     include: [
        //         {
        //             model: DailyUpload,
        //             as: 'dailyUploads',
        //             include: [
        //                 {
        //                     model: Resource,
        //                     as: 'resource'
        //                 }
        //             ]
        //         }
        //     ]
        // });

        // const standards = await Standard.findAll({
        //     attributes: ['id', 'name', 'courseLength',
        //         [Sequelize.fn('COUNT', Sequelize.literal('CASE WHEN "dailyUploads->resource"."type" = \'video\' THEN 1 ELSE 0 END')), 'totalVideos'],
        //         [Sequelize.fn('COUNT', Sequelize.literal('CASE WHEN "dailyUploads->resource"."type" != \'video\' THEN 1 ELSE 0 END')), 'totalNonVideoResources']
        //     ],
        //     include: [
        //         {
        //             model: DailyUpload,
        //             as: 'dailyUploads',
        //             include: [
        //                 {
        //                     model: Resource,
        //                     as: 'resource',
        //                     attributes: []
        //                 }
        //             ]
        //         }
        //     ],
        //     group: ['Standard.id', 'dailyUploads.id', 'dailyUploads->resource.id']
        // });

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

        return { code: 200, data: standards };

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting the summarized standards');
        return { code: 500 };
    }
};

// const getAllSummarizedStandards = async () => {
//     try {
//         const standards = await Standard.findAll(); // Fetch all standards
//         const standardSummaries = [];
        
//         for (const standard of standards) {
//             const dailyUploads = await standard.getDailyUploads(); // Fetch associated daily uploads
//             const resourceIds = dailyUploads.map(upload => upload.resourceId);
//             const resources = await Resource.findAll({ where: { id: resourceIds } }); // Fetch associated resources
//             // console.log('\n\n\n\nfirst')
//             const numVideos = resources.filter(resource => resource.type === RESOURCE_TYPES.VIDEO).length;
//             const numNonVideoResources = resources.filter(resource => resource.type !== RESOURCE_TYPES.VIDEO).length;
//             // console.log('\n\n\n\second')
            
//             const summary = {
//                 id: standard.id,
//                 courseLength: standard.courseLength,
//                 numVideos,
//                 numNonVideoResources
//             };
            
//             standardSummaries.push(summary);
//         }
        
//         return standardSummaries;
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