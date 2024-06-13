const { Sequelize } = require("sequelize");
const { logger } = require("../Logs/logger.js");
// @ts-ignore
const { Classroom, Standard, ClassroomCourses, ClassroomStudent, User } = require("../models/index.js");
const { RESOURCE_TYPES, CLASSROOM_STATUS } = require("../utils/enumTypes.js");

const createClassroom = async ({ name, teacherId }) => {
    try {
        const existingClassroom = await Classroom.findOne({ where: { name } });
        if (existingClassroom) {
            return { code: 409 };
        }

        const classroom = await Classroom.create({ name, teacherId });
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

const getClassroom = async ({ classroomId }) => {
    try {
        const classroom = await Classroom.findOne({ where: { id: classroomId } });
        return { code: 200, data: classroom };

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting the classroom');
        return { code: 500 };
    }
};

const getAllClassroomsOfTeacher = async ({ teacherId }) => {
    try {
        const classrooms = await Classroom.findAll({ 
            where: { 
                teacherId: teacherId,
                status: CLASSROOM_STATUS.ACTIVE
            } 
        });
        const options = classrooms?.map(classroom => {
            return { label: classroom.id, value: classroom.name };
        });
        return { code: 200, data: options };

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting all classroom of teacher');
        return { code: 500 };
    }
}

const assignStandardToClassrooms = async ({ classroomIds, standardId }) => {
    try {
        const standard = await Standard.findOne({ where: { id: standardId } });
        if (!standard) {
            return { code: 404, message: "Standard not found" };
        }

        if (new Set(classroomIds).size !== classroomIds.length) {
            return { code: 400, message: "Duplicate classrooms are not allowed." };
        }

        const classrooms = await Promise.all(classroomIds.map(id => Classroom.findOne({ 
            where: { id },
            raw: true
        })));
        
        const notFoundIds = classroomIds.filter((id, index) => !classrooms[index]);
        if (notFoundIds.length > 0) {
            return { code: 404, message: `Classrooms not found: ${notFoundIds.join(', ')}` };
        }

        const inactiveNames = classrooms
                                .filter(classroom => classroom && classroom.status === CLASSROOM_STATUS.INACTIVE)
                                .map(classroom => classroom.name);
        if (inactiveNames.length > 0) {
            return { code: 404, message: `Inactive classrooms: ${inactiveNames.join(', ')}` };
        }

        const classroomsWithStandard = await Classroom.findAll({
            where: { id: classroomIds },
            include: [{
                model: ClassroomCourses,
                as: 'classroomCourses',
                where: { standardId },
                required: true
            }]
        });
        if (classroomsWithStandard.length > 0) {
            const classroomNames = classroomsWithStandard.map(classroom => classroom.name);
            return { code: 409, message: `Classrooms with this course already assigned are: ${classroomNames.join(', ')}` };
        }

        const classroomStandards = await Promise.all(classroomIds.map(async id => {
            const existingEntry = await ClassroomCourses.findOne({ where: { classroomId: id, standardId } });
            if (!existingEntry) {
                return ClassroomCourses.create({ classroomId: id, standardId });
            }
        }));

        return { code: 200, data: classroomStandards };

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while assigning standard to classroom');
        return { code: 500 };
    }
}

const getSummarizedClassroomsOfTeacher = async ({ teacherId }) => {
    try {
        const classrooms = await Classroom.findAll({
            where: { 
                teacherId: teacherId,
                status: CLASSROOM_STATUS.ACTIVE
            },
            include: [{
                model: ClassroomStudent,
                as: 'classroomStudents'
            }]
        });

        const classroomsWithStudents = classrooms?.map(classroom => {
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

const getClassesAndCourses = async ({ teacherId }) => {
    try {
        const summarizedStandards = await ClassroomCourses.findAll({
            attributes: ['id'],
            include: [{
                model: Classroom,
                as: 'classroom',
                where: { 
                    teacherId: teacherId,
                    status: CLASSROOM_STATUS.ACTIVE 
                },
                attributes: ['name']
            },
            {
                model: Standard,
                as: 'standard',
                attributes: ['id', 'name']
            }],
        })

        const transformedSummarizedStandards = summarizedStandards?.map(traversingStandard => {
            const { id, classroom, standard } = traversingStandard.toJSON();
            return { id, className: classroom.name, standardName: standard.name, standardId: standard.id }
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
            return { code: 404, message: 'Relation between standard and class Not found' };
        }

        const classroom = await Classroom.findOne({ where: { id: classroomCourse.classroomId } });
        if (!classroom) {
            return { code: 404, message: 'Classroom not found' };
        }
        if (classroom.status !== CLASSROOM_STATUS.ACTIVE) {
            return { code: 404, message: 'Classroom is not active any more' };
        }

        const deleted = await classroomCourse.destroy();

        return { code: 200, data: deleted };
    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while deleting class course');
        return { code: 500 };
    }
}

// const getClassroomStudents = async ({ classroomId, page, limit }) => {
//     try {
//         page = parseInt(page, 10);
//         limit = parseInt(limit, 10);

//         if (isNaN(page) || page < 1) {
//             page = 1;
//         }

//         if (isNaN(limit) || limit < 1) {
//             limit = 10; 
//         }
//         const offset = (page - 1) * limit;

//         const classroom = await Classroom.findOne({
//             where: { id: classroomId },
//             attributes: ['name'],
//             include: [{
//                 model: ClassroomStudent,
//                 as: 'classroomStudents',
//                 attributes: ['id'],
//                 offset,
//                 limit,
//                 include: [{
//                     model: User,
//                     as: 'student',
//                     attributes: ['id', 'name', 'email', 'image'],
//                 }]
//             }]
//         });

//         if (!classroom) {
//             return { code: 404 };
//         }

//         const students = classroom.classroomStudents.map(classroomStudent => {
//             const { id, student } = classroomStudent.toJSON();
//             return { id, name: student.name, email: student.email, image: student.image, performance: 100};
//         });

//         return { code: 200, data: { className: classroom.name, students }};

//     } catch (error) {
//         console.log('\n\n\n\n', error);
//         logger.error(error?.message || 'An error occurred while getting classroom students');
//         return { code: 500 };
//     }
// }

const getClassroomStudents = async ({ classroomId, page, limit }) => {
    try {
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);

        if (isNaN(page) || page < 1) {
            page = 1;
        }

        if (isNaN(limit) || limit < 1) {
            limit = 10; 
        }
        const offset = (page - 1) * limit;

        const classroom = await Classroom.findOne({
            where: { 
                id: classroomId,
            },
            attributes: ['name', 'status'],
            raw: true
        });

        if (!classroom) {
            return { code: 404, message: 'Classroom not found'};
        }
        if (classroom.status !== CLASSROOM_STATUS.ACTIVE) {
            return { code: 404, message: 'Classroom is not active any more' };
        }

        const classroomStudents = await ClassroomStudent.findAndCountAll({
            where: { classroomId: classroomId },
            offset: offset,
            limit: limit,
            attributes: ['id'],
            include: [{
                model: User,
                as: 'student',
                attributes: ['id', 'name', 'email', 'image'],
            }]
        });

        const students = classroomStudents.rows.map((classroomStudent, index) => {
            const { id, student } = classroomStudent.toJSON();
            return { id, index: offset + index + 1, name: student.name, email: student.email, image: student.image, performance: 100, grade: classroom.name, gradeId: classroomId };
        });

        return { code: 200, data: { className: classroom.name,  totalPages: Math.ceil(classroomStudents.count / limit), students }};

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting classroom students');
        return { code: 500 };
    }
}

const addStudentToClassroom = async ({ classroomId, studentId }) => {
    try {
        const classroom = await Classroom.findOne({ where: { id: classroomId } });
        if (!classroom) {
            return { code: 404 };
        }
        if (classroom.status !== CLASSROOM_STATUS.ACTIVE) {
            return { code: 400, message: 'Classroom is not active any more' };
        }

        const student = await User.findOne({ where: { id: studentId } });
        if (!student) {
            return { code: 405 };
        }
        
        const existingClassroomStudent = await ClassroomStudent.findOne({ 
            where: { studentId },
            include: [
                {
                    model: Classroom,
                    as: 'classroom',
                    where: { status: CLASSROOM_STATUS.ACTIVE }
                }
            ]
        });
        if (existingClassroomStudent) {
            return { code: 409, message: `Student is already enrolled in ${existingClassroomStudent.classroom.name}` };
        }

        const classroomStudent = await ClassroomStudent.create({ classroomId, studentId });

        return { code: 200, data: classroomStudent };
    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while adding student to classroom');
        return { code: 500 };
    }
}

const removeStudentFromClassroom = async ({ classroomStudentId }) => {
    try {
        const classroomStudent = await ClassroomStudent.findByPk(classroomStudentId);
        if (!classroomStudent) {
            return { code: 404, message: 'Relation between student and class not found' };
        }

        const classroom = await Classroom.findOne({ where: { id: classroomStudent.classroomId } });
        if (!classroom) {
            return { code: 404, message: 'Classroom not found' };
        }
        if (classroom.status !== CLASSROOM_STATUS.ACTIVE) {
            return { code: 404, message: 'Classroom is not active any more' };
        }

        const deleted = await classroomStudent.destroy();

        return { code: 200, data: deleted };
    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while removing student from classroom');
        return { code: 500 };
    }
}

const updateClassroomStudent = async ({ classroomStudentId, name, email, classroomId, image }) => {
    try {
        const isEmailRegisterd = await User.findOne({ where: { email } });
        if (isEmailRegisterd) {
            return { code: 400 };
        }

        const classroomStudent = await ClassroomStudent.findOne({ where: { id: classroomStudentId } });
        if (!classroomStudent) {
            return { code: 404, message: 'Relation between student and class not found' };
        }
    
        const student = await User.findOne({ where: { id: classroomStudent.studentId } });
        if (!student) {
            return { code: 404, message: 'Student not found' };
        }

        const classroom = await Classroom.findOne({ where: { id: classroomId } });
        if (!classroom) {
            return { code: 404, message: 'Classroom not found' };
        }
        if (classroom.status !== CLASSROOM_STATUS.ACTIVE) {
            return { code: 404, message: 'Classroom is not active any more' };
        }

        const existingClassroomStudent = await ClassroomStudent.findOne({ where: { classroomId, studentId: classroomStudent.studentId } });
        if (existingClassroomStudent) {
            return { code: 409 };
        }

        const updatedClassroomStudent = await classroomStudent.update({classroomId: classroomId});

        const updatedStudent = await student.update({ name, email, image });
        const { name: updatedName, email: updatedEmail, image: updatedImage } = updatedStudent.toJSON();
        const { classroomId: updatedClassroomId } = updatedClassroomStudent.toJSON();

        return { 
            code: 200, 
            data: {
                id: classroomStudent.studentId, name: updatedName, email: updatedEmail, image: updatedImage,
                classroomId: updatedClassroomId
            }};
    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while updating classroom student');
        return { code: 500 };
    }
}

module.exports = {
    createClassroom,
    getClassroom,
    getAllClassroomsOfTeacher,
    assignStandardToClassrooms,
    getSummarizedClassroomsOfTeacher,
    getClassesAndCourses,
    deleteClassCourse,
    getClassroomStudents,
    addStudentToClassroom,
    removeStudentFromClassroom,
    updateClassroomStudent
};
