const { Sequelize } = require("sequelize");
const { logger } = require("../Logs/logger.js");
const { Classroom, Standard, ClassroomCourses, ClassroomStudent } = require("../models/index.js");
const { RESOURCE_TYPES } = require("../utils/enumTypes.js");

const getTeacherDashboardClassroomsOverview = async ({teacherId}) => {
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

const getTeacherDashboardStandardsOverview = async ({teacherId}) => {
    try {
        const summarizedStandards = await ClassroomCourses.findAll({
            attributes: ['id'],
            include: [{ 
                model: Classroom, 
                as: 'classroom', 
                where: {teacherId}, 
                attributes: ['name']
            },
            { 
                model: Standard, 
                as: 'standard', 
                attributes: ['id', 'name']
            }],
        })

        const transformedSummarizedStandards = summarizedStandards.map(traversingStandard => {
            const {id, classroom, standard} = traversingStandard.toJSON();
            return {id, className: classroom.name, standardName: standard.name, standardId: standard.id}
        });

        return { code: 200, data: transformedSummarizedStandards };
    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting overview of standards for teacher dahsboard');
        return { code: 500 };
    }
}

const deleteClassCourse = async ({ classroomCourseId }) => {
    try {
        const classroomCourse = await ClassroomCourses.findByPk(classroomCourseId);
        if (!classroomCourse) {
            return { code: 404 };
        }
        const deleted = await classroomCourse.destroy();

        return { code: 200, data: deleted };
    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while deleting class course');
        return { code: 500 };
    }
}

module.exports = {
    getTeacherDashboardClassroomsOverview,
    getTeacherDashboardStandardsOverview,
    deleteClassCourse
};
