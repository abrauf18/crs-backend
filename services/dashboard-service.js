const { Sequelize, Op } = require("sequelize");
const { logger } = require("../Logs/logger.js");
const { Classroom, Standard, ClassroomCourses, ClassroomStudent, User, Resource } = require("../models/index.js");
const { RESOURCE_TYPES } = require("../utils/enumTypes.js");

const getTeacherDashboardSummaries = async ({teacherId}) => {
    try {
        const classrooms = await Classroom.findAll({
            where: {teacherId},
            include: [{
                model: ClassroomStudent,
                as: 'classroomStudents'
            }]
        });

        const totalClassrooms = classrooms.length;
        const totalStudents = classrooms.reduce((total, classroom) => total + classroom.classroomStudents.length, 0);

        return { code: 200, data: { totalClassrooms, totalStudents } };

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting total classrooms and students of teacher for teacher dahsboard');
        return { code: 500 };
    }
}

const getAdminDashboardSummaries = async () => {
    try {
        const users = await User.findAll({});

        const videos = await Resource.findAll({
            where: {type: RESOURCE_TYPES.VIDEO},
        });

        const resources = await Resource.findAll({
            where: {type: {[Op.not]: RESOURCE_TYPES.VIDEO}},
        });

        result = {
            usersCount: users.length,
            videosCount: videos.length,
            resourcesCount: resources.length
        }

        return { code: 200, data: result };
    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting overview of users and resources for admin dahsboard');
        return { code: 500 };
    }
}

module.exports = {
    getTeacherDashboardSummaries,
    getAdminDashboardSummaries
};
