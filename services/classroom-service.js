const { Sequelize } = require("sequelize");
const { logger } = require("../Logs/logger.js");
const { Classroom, Standard, ClassroomCourses, ClassroomStudent } = require("../models/index.js");
const { RESOURCE_TYPES } = require("../utils/enumTypes.js");

const createClassroom = async ({name, teacherId}) => {
    try {
        const classroom = await Classroom.create({name, teacherId});
        if (!classroom) {
            return { code: 500 };
        }
        return { code: 200, data: classroom };

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while creating classroom');
        return { code: 500 };
    }
};

const getClassroom = async ({classroomId}) => {
    try {
        const classroom = await Classroom.findOne({where: {id: classroomId}});
        return { code: 200, data: classroom };

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting the classroom');
        return { code: 500 };
    }
};

const getAllClassroomsOfTeacher = async ({teacherId}) => {
    try {
        const classrooms = await Classroom.findAll({where: { teacherId }});
        const options = classrooms.map(classroom => {
            return { label: classroom.id, value: classroom.name };
        });
        return { code: 200, data: options };

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting all classroom of teacher');
        return { code: 500 };
    }
}

const assignStandardToClassrooms = async ({classroomIds, standardId}) => {
    try {
        const classrooms = await Promise.all(classroomIds.map(id => Classroom.findOne({where: {id}})));
        const notFoundIds = classroomIds.filter((id, index) => !classrooms[index]);
        if (notFoundIds.length > 0) {
            return { code: 404, message: `Classrooms not found: ${notFoundIds.join(', ')}` };
        }
        const standard = await Standard.findOne({where: {id: standardId}});
        if (!standard) {
            return { code: 409 };
        }

        
        const classroomStandards = await Promise.all(classroomIds.map(async id => {
            const existingEntry = await ClassroomCourses.findOne({where: {classroomId: id, standardId}});
            if (!existingEntry) {
                return ClassroomCourses.create({classroomId: id, standardId});
            }
        }));

        return { code: 200, data: classroomStandards};

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while assigning standard to classroom');
        return { code: 500 };
    }
}

const getSummarizedClassroomsOfTeacher = async ({teacherId}) => {
    try {
        const classrooms = await Classroom.findAll({
            where: {teacherId},
            include: [{
                model: ClassroomStudent,
                as: 'classroomStudents'
            }]
        });

        const classroomsWithStudents = classrooms.map(classroom => {
            const { id, name, classroomStudents } = classroom.toJSON();
            return {
                id,
                name,
                studentCount: classroomStudents.length
            };
        });

        return { code: 200, data: classroomsWithStudents };

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting summarized classrooms of teacher');
        return { code: 500 };
    }
}

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
                attributes: ['name']
            }],
        })

        const transformedSummarizedStandards = summarizedStandards.map(traversingStandard => {
            const {classroom, standard, id} = traversingStandard.toJSON();
            return {className: classroom.name, standardName: standard.name, id}
        });

        return { code: 200, data: transformedSummarizedStandards };
    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting overview of standards for teacher dahsboard');
        return { code: 500 };
    }
}

module.exports = {
    createClassroom,
    getClassroom,
    getAllClassroomsOfTeacher,
    assignStandardToClassrooms,
    getSummarizedClassroomsOfTeacher,
    getTeacherDashboardClassroomsOverview,
    getTeacherDashboardStandardsOverview
};
