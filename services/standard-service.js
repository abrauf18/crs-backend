const { Sequelize } = require("sequelize");
const { logger } = require("../Logs/logger.js");
const { Standard, DailyUpload } = require("../models/index.js");
const { RESOURCE_TYPES } = require("../utils/enumTypes.js");

const createStandard = async ({ name, description, courseLength, dailyUploads }) => {
    try {
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
        logger.error(error?.message || 'An error occurred while updating the video');
        return { code: 500 };
    }
};

module.exports = {
  createStandard
};