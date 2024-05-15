const { Sequelize } = require("sequelize");
const { logger } = require("../Logs/logger.js");
const { Classroom, Standard, ClassroomCourses } = require("../models/index.js");
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
        if (new Set(classroomIds).size !== classroomIds.length) {
            return { code: 400 };
        }
        const classrooms = await Promise.all(classroomIds.map(id => Classroom.findOne({where: {id}})));
        const notFoundIds = classroomIds.filter((id, index) => !classrooms[index]);
        if (notFoundIds.length > 0) {
            return { code: 404, message: `Classrooms not found: ${notFoundIds.join(', ')}` };
        }
        const standard = await Standard.findOne({where: {id: standardId}});
        if (!standard) {
            return { code: 405 };
        }

        const classroomsWithStandard = await Classroom.findAll({
            where: {id: classroomIds},
            attributes: ['name'],
            include: [{
                model: ClassroomCourses,
                as: 'classroomCourses',
                where: {standardId},
                required: true
            }]
        });
        if (classroomsWithStandard.length > 0) {
            const classroomNames = classroomsWithStandard.map(classroom => classroom.name);
            return { code: 409, message: `This standard is already assigned to the following classrooms: ${classroomNames.join(', ')}` };
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

module.exports = {
    createClassroom,
    getClassroom,
    getAllClassroomsOfTeacher,
    assignStandardToClassrooms
};
