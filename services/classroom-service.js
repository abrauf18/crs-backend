const { Sequelize, Op } = require("sequelize");
const { logger } = require("../Logs/logger.js");
// @ts-ignore
const { sequelize, Classroom, Standard, ClassroomCourses, ClassroomStudent, User, DailyUpload, Resource, Video, VideoTracking, Question, VideoQuestionAnswer, AssessmentResourcesDetail, AssessmentAnswer, DailyProgress } = require("../models/index.js");
const { RESOURCE_TYPES, CLASSROOM_STATUS } = require("../utils/enumTypes.js");
const ROLES = require("../models/roles/index.js");

const createClassroom = async ({ name, teacherId, schoolId }) => {
    try {
        const existingClassroom = await Classroom.findOne({ 
            where: { 
                name,
                schoolId,
            } 
        });
        if (existingClassroom) {
            return { code: 409 };
        }

        const classroom = await Classroom.create({ name, teacherId, schoolId });
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

        const classroom = await Classroom.findByPk(classroomId, {
            attributes: ['id', 'name', 'teacherId'],
            include: [
                {
                    model: ClassroomCourses,
                    as: 'classroomCourses',
                    attributes: ['id'],
                    include: [{
                        model: Standard,
                        as: 'standard',
                        attributes: ['id', 'name'],
                        include: [{ 
                            model: DailyUpload, 
                            as: 'dailyUploads',
                            attributes: ['id', 'accessDate', 'weightage'],
                            where: {
                                weightage: {
                                    [Op.gt]: 0
                                }
                            },
                            required: true,
                            separate: true,
                            include: [{
                                model: Resource,
                                as: 'resource',
                                attributes: ['id', 'name', 'type', 'topic', 'url'],
                                include: [
                                    {
                                        model: Video,
                                        as: 'video',
                                        attributes: ['id'],
                                        include: [{
                                            separate: true,
                                            model: Question,
                                            as: 'questions',
                                            required: false,
                                            attributes: ['id', 'totalMarks'],
                                        }]
                                    },
                                    {
                                        model: AssessmentResourcesDetail,
                                        as: 'AssessmentResourcesDetail',
                                        attributes: ['id', 'totalMarks', 'deadline']
                                    }
                                ]
                            }]
                        }]
                    }]
                },
                {
                    model: ClassroomStudent,
                    as: 'classroomStudents',
                    attributes: ['id', 'classroomId', 'studentId'],
                    offset: offset,
                    limit: limit,
                    order: [['id', 'ASC']],
                    include: [{
                        model: User,
                        as: 'student',
                        attributes: ['id', 'name', 'email', 'image'],
                        include: [
                            {
                                model: AssessmentAnswer,
                                attributes: ['id', 'userId', 'standardId', 'obtainedMarks'],
                                separate: true,
                                required: false,
                                include: [{
                                    model: AssessmentResourcesDetail,
                                    as: 'assessmentResourcesDetail',
                                    attributes: ['id', 'totalMarks', 'deadline', 'resourceId'],
                                    include: [{
                                        model: Resource,
                                        as: 'resource',
                                        attributes: ['id', 'name', 'type', 'topic', 'url'],
                                        include:[{
                                            model: DailyUpload,
                                            as: 'DailyUpload',
                                            attributes: ['weightage', 'accessDate', 'standardId', 'resourceId']
                                        }]
                                    }]
                                }]
                            },
                            {
                                model: VideoQuestionAnswer,
                                attributes: ['id', 'userId', 'obtainedMarks'],
                                separate: true,
                                required: false,
                                include: [{
                                    model: Question,
                                    as: 'question',
                                    attributes: ['id', 'totalMarks'],
                                    include: [
                                        {
                                            model: Video,
                                            as: 'video',
                                            attributes: ['id', 'resourceId'],
                                            include: [{
                                                model: Resource,
                                                as: 'resource',
                                                attributes: ['id', 'name', 'type', 'topic', 'url'],
                                                include:[{
                                                    model: DailyUpload,
                                                    as: 'DailyUpload',
                                                    attributes: ['weightage', 'accessDate', 'standardId', 'resourceId']
                                                }]
                                            }]
                                        }
                                    ]
                                }]
                            }
                        ]
                    }]
                }
            ]
        });

        if (!classroom) {
            return { code: 404, message: 'Classroom not found' };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalWeightageSum = 0;
        const standardsMap = new Map();
        const users = [];

        classroom.classroomCourses?.forEach(course => {
            const standard = course.standard;
            if (standard) {
                if (!standardsMap.has(standard.id)) {
                    standardsMap.set(standard.id, {
                        standardId: standard.id,
                        standardName: standard.name,
                        totalWeightage: 0,
                        usersWeightage: []
                    });
                }

                const standardEntry = standardsMap.get(standard.id);

                if (standard.dailyUploads && standard.dailyUploads.length > 0) {
                    standardEntry.totalWeightage += standard.dailyUploads
                        .filter(upload => new Date(upload.accessDate) < today)
                        .reduce((acc, upload) => acc + upload.weightage, 0);
                }
                totalWeightageSum += standardEntry.totalWeightage;
            }
        });

        const numberOfStandards = standardsMap.size;
        const currentTotalWeightage = totalWeightageSum / numberOfStandards;

        classroom.classroomStudents?.forEach(student => {
            const studentData = {
                id: student.student.id,
                name: student.student.name,
                email: student.student.email,
                image: student.student.image,
                grade: classroom.name,
                gradeId: classroom.id,
                standardsWeightage: []
            };

            classroom.classroomCourses?.forEach(course => {
                const standard = course.standard;
                if (standard) {
                    const standardEntry = standardsMap.get(standard.id);
                    let obtainedWeightage = 0;

                    student.student.VideoQuestionAnswers?.forEach(answer => {
                        const videoQuestion = answer.question;
                        if (videoQuestion.video && videoQuestion.video.resource.DailyUpload) {
                            const dailyUpload = videoQuestion.video.resource.DailyUpload;
                            if (new Date(dailyUpload.accessDate) < today) {
                                obtainedWeightage += (answer.obtainedMarks / videoQuestion.totalMarks) * dailyUpload.weightage;
                            }
                        }
                    });

                    student.student.AssessmentAnswers?.forEach(answer => {
                        const assessmentResource = answer.assessmentResourcesDetail;
                        if (assessmentResource.resource.DailyUpload) {
                            const dailyUpload = assessmentResource.resource.DailyUpload;
                            if (new Date(dailyUpload.accessDate) < today) {
                                obtainedWeightage += (answer.obtainedMarks / assessmentResource.totalMarks) * dailyUpload.weightage;
                            }
                        }
                    });

                    studentData.standardsWeightage.push({
                        standardId: standard.id,
                        standardName: standard.name,
                        obtainedWeightage,
                        totalWeightage: standardEntry.totalWeightage
                    });
                }
            });

            const totalStandards = studentData.standardsWeightage.length;
            const totalObtainedWeightage = studentData.standardsWeightage.reduce((acc, sw) => acc + sw.obtainedWeightage, 0);
            const totalWeightage = studentData.standardsWeightage.reduce((acc, sw) => acc + sw.totalWeightage, 0);

            studentData.currentObtainedWeightage = totalObtainedWeightage / totalStandards;
            studentData.totalWeightage = totalWeightage / totalStandards;

            users.push(studentData);
        });

        const students = users.map((user, index) => ({
            id: user.id,
            index: offset + index + 1,
            name: user.name,
            image: user.image,
            email: user.email,
            grade: user.grade,
            performance: user.currentObtainedWeightage,
            gradeId: user.gradeId
        }));

        const response = {
            className: classroom.name,
            totalPages: Math.ceil(users.length / limit),
            students
        };

        return { code: 200, data: response };

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting classroom students');
        return { code: 500 };
    }
}

const addStudentToClassroom = async ({ classroomId, email, schoolId }) => {
    try {
        const classroom = await Classroom.findOne({ where: { id: classroomId } });
        if (!classroom) {
            return { code: 404 };
        }
        if (classroom.status !== CLASSROOM_STATUS.ACTIVE) {
            return { code: 400, message: 'Classroom is not active any more' };
        }

        const student = await User.findOne({ where: { email: email } });
        if (!student) {
            return { code: 405 };
        }
        if (student.role !== ROLES.STUDENT) {
            return { code: 400, message: 'Only Students are allowed to be added to a classroom' };
        }
        if (student.school_id === schoolId) {
            return { code: 403, message: 'Student does not exist in this school' };
        }
        
        const existingClassroomStudent = await ClassroomStudent.findOne({ 
            where: { studentId: student.id },
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

        const classroomStudent = await ClassroomStudent.create({ classroomId: classroomId, studentId: student.id });

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

const updateClassroomStudent = async ({ studentId, name, email, classroomId, image }) => {
    const t = await sequelize.transaction();

    try {
        const student = await User.findOne({ where: { id: studentId }, transaction: t });
        if (!student) {
            await t.rollback();
            return { code: 404, message: 'Student not found' };
        }

        let updatedClassroomStudent = {};
        let updatedStudent = {};
        let updateData = {};

        if (classroomId) {
            const classroom = await Classroom.findOne({ where: { id: classroomId }, transaction: t });
            if (!classroom) {
                await t.rollback();
                return { code: 404, message: 'Classroom not found' };
            }
            if (classroom.status !== CLASSROOM_STATUS.ACTIVE) {
                await t.rollback();
                return { code: 404, message: 'Classroom is not active anymore' };
            }
            const existingClassroomStudent = await ClassroomStudent.findOne({ where: { classroomId, studentId }, transaction: t });
            if (existingClassroomStudent) {
                await t.rollback();
                return { code: 409, message: 'Conflict: Classroom student already exists' };
            }
            const classroomStudent = await ClassroomStudent.findOne({ 
                where: { 
                    studentId 
                }, 
                include: [{
                    model: Classroom,
                    as: 'classroom',
                    where: { status: CLASSROOM_STATUS.ACTIVE },
                    required: true
                }],
                transaction: t 
            });
            if (classroomStudent) {
                console.log('\n\n\n\n ', classroomStudent, classroomId)
                updatedClassroomStudent = await classroomStudent.update({ classroomId: classroomId }, { transaction: t });
            }
        }

        if (email) {
            const isEmailRegistered = await User.findOne({ where: { email }, transaction: t });
            if (isEmailRegistered) {
                await t.rollback();
                return { code: 409, message: 'Conflict: Email already registered' };
            }
            updateData.email = email;
        }
        if (name) updateData.name = name;
        if (image) updateData.image = image;

        if (Object.keys(updateData).length > 0) {
            updatedStudent = await student.update(updateData, { transaction: t });
        }

        // Extract updated information if updates were made
        const updatedInfo = {};
        if (updatedStudent) {
            updatedInfo.name = updatedStudent.name;
            updatedInfo.email = updatedStudent.email;
            updatedInfo.image = updatedStudent.image;
        }
        if (updatedClassroomStudent) {
            updatedInfo.classroomId = updatedClassroomStudent.classroomId;
        }

        // Commit the transaction
        await t.commit();

        return { 
            code: 200, 
            data: {
                id: studentId,
                ...updatedInfo
            }
        };
    } catch (error) {
        // Rollback the transaction if any error occurs
        await t.rollback();
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while updating classroom student');
        return { code: 500, message: error.message };
    }
}

const updateTeacherClassrooms = async ({schoolId, teacherId, classroomIds}) => {
    try {
        const teacher = await User.findOne({ where: { id: teacherId, school_id: schoolId }});
        if (!teacher) {
            return { code: 404, message: 'Teacher not found' };
        }

        const classrooms = await Classroom.findAll({ where: { id: classroomIds, schoolId: schoolId } });
        const foundClassroomIds = classrooms?.map(classroom => classroom.id);
        const notFoundClassroomIds = classroomIds?.filter(id => !foundClassroomIds.includes(id));

        if (notFoundClassroomIds.length > 0) {
            const notFoundClassrooms = classrooms?.filter(classroom => notFoundClassroomIds.includes(classroom.id));
            const notFoundClassroomNames = notFoundClassrooms.map(classroom => classroom.name);
            return { code: 404, message: `${notFoundClassroomNames.length > 1 ? 'These classrooms are' : 'This classroom is'} not found: `, notFoundClassroomNames };
        }

        const classroomsWithDifferentTeacher = classrooms.filter(classroom => classroom.teacherId && classroom.teacherId !== teacherId);
        if (classroomsWithDifferentTeacher.length > 0) {
            const classroomsWithDifferentTeacherNames = classroomsWithDifferentTeacher.map(classroom => classroom.name);
            return { code: 409, message: `${classroomsWithDifferentTeacher.length > 1 ? 'These classrooms' : 'This classroom'} already has a different teacher assigned: `, classroomsWithDifferentTeacherNames };
        }

        //classes from which to remove teacher 
        const teacherClassrooms = await Classroom.findAll({ where: { teacherId: teacherId, schoolId: schoolId } });
        const classroomsToRemoveTeacher = teacherClassrooms.filter(classroom => !classroomIds.includes(classroom.id));
        await Promise.all(classroomsToRemoveTeacher.map(classroom => classroom.update({ teacherId: null })));

        //classes in which to add teacher
        const updatedClassrooms = await Promise.all(classrooms.map(classroom => classroom.update({ teacherId })));
        return { code: 200, data: updatedClassrooms };
    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while updating teacher classroom');
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
    updateClassroomStudent,
    updateTeacherClassrooms
};
