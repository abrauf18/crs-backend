const { Sequelize } = require("sequelize");
const { logger } = require("../Logs/logger.js");
const { Classroom } = require("../models/index.js");
const { RESOURCE_TYPES } = require("../utils/enumTypes.js");

const createClassroom = async ({name, teacherId}) => {
    try {
        const classroom = await Classroom.create({name, teacherId});
        if (!classroom) {
            console.log('\n\n\n\n', 'no classroom');
            return { code: 500 };
        }
        return { code: 200, data: classroom };

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting the videos');
        return { code: 500 };
    }
};

const getClassroom = async ({classroomId}) => {
    try {
        const classroom = await Classroom.findOne({where: {id: classroomId}});
        if (!classroom) {
            console.log('\n\n\n\n', 'no classroom');
            return { code: 404 };
        }
        return { code: 200, data: classroom };

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting the videos');
        return { code: 500 };
    }
};

module.exports = {
    createClassroom,
    getClassroom
};
