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

        const data = await Classroom.findByPk(classroomId, {
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
                                        include: [{
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
                                                include: [{
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

        if (!data) {
            return { code: 404, message: 'Classroom not found' };
        }
        
        // Current date for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const classItem = data;
        const standardsMap = new Map();
        const currentDate = new Date();
        
        // Iterate over each course in the classroom to map standards
        classItem.classroomCourses?.forEach(course => {
            const standard = course.standard;
            if (standard) {
                // If the standard is not already in the map, add it
                if (!standardsMap.has(standard.id)) {
                    standardsMap.set(standard.id, {
                        standardId: standard.id,
                        standardName: standard.name,
                        currentTotalWeightage: 0,
                        usersWeightage: [],
                        averageObtainedWeightage: 0  // Default value set to 0
                    });
                }
        
                const standardEntry = standardsMap.get(standard.id);
        
                // Calculate the total weightage for the standard based on daily uploads up to today
                if (standard.dailyUploads && standard.dailyUploads.length > 0) {
                    standardEntry.currentTotalWeightage += standard.dailyUploads
                        .filter(upload => new Date(upload.accessDate) <= currentDate)
                        .reduce((acc, upload) => acc + upload.weightage, 0);
                }
            }
        });
        
        // Iterate over each student in the classroom to calculate obtained weightage
        classItem.classroomStudents?.forEach(student => {
            classItem.classroomCourses?.forEach(course => {
                const standard = course.standard;
                if (standard) {
                    const standardEntry = standardsMap.get(standard.id);
        
                    // Ensure the student is present in the usersWeightage array
                    let userEntry = standardEntry.usersWeightage.find(u => u.userId === student.student.id);
                    if (!userEntry) {
                        userEntry = {
                            userId: student.student.id,
                            userName: student.student.name,
                            obtainedWeightage: 0,
                            questionsDetails: []
                        };
                        standardEntry.usersWeightage.push(userEntry);
                    }
        
                    // Track total marks and obtained marks for video questions
                    const videoWeightages = new Map();
                    student.student.VideoQuestionAnswers?.forEach(answer => {
                        const videoQuestion = answer.question;
                        if (videoQuestion.video && videoQuestion.video.resource.DailyUpload) {
                            const dailyUpload = videoQuestion.video.resource.DailyUpload;
                            if (new Date(dailyUpload.accessDate) <= currentDate && dailyUpload.standardId === standard.id) {
                                const videoId = videoQuestion.video.id;
                                if (!videoWeightages.has(videoId)) {
                                    videoWeightages.set(videoId, {
                                        totalMarks: 0,
                                        obtainedMarks: 0,
                                        weightage: dailyUpload.weightage
                                    });
                                }
                                const questionTotalMarks = videoQuestion.totalMarks;
                                const questionObtainedMarks = Math.max(answer.obtainedMarks, 0);
                                videoWeightages.get(videoId).totalMarks += questionTotalMarks;
                                videoWeightages.get(videoId).obtainedMarks += questionObtainedMarks;
        
                                userEntry.questionsDetails.push({
                                    id: videoQuestion.id,
                                    statement: videoQuestion.statement,
                                    answer: answer.answer,
                                    totalMarks: questionTotalMarks,
                                    obtainedMarks: questionObtainedMarks
                                });
                            }
                        }
                    });
        
                    // Calculate weightage for each video based on total marks and obtained marks of its questions
                    videoWeightages.forEach((video, videoId) => {
                        const weightage = video.weightage;
                        const totalMarks = video.totalMarks;
                        const obtainedMarks = video.obtainedMarks;
                        const videoWeightage = (obtainedMarks / totalMarks) * weightage;
                        userEntry.obtainedWeightage += videoWeightage;
                    });
        
                    // Calculate obtained weightage from assessment answers
                    student.student.AssessmentAnswers?.forEach(answer => {
                        const assessmentResource = answer.assessmentResourcesDetail;
                        if (assessmentResource.resource.DailyUpload) {
                            const dailyUpload = assessmentResource.resource.DailyUpload;
                            if (new Date(dailyUpload.accessDate) <= currentDate && dailyUpload.standardId === standard.id) {
                                const weightage = dailyUpload.weightage;
                                const obtainedMarks = Math.max(answer.obtainedMarks, 0);
                                const questionWeightage = (obtainedMarks / assessmentResource.totalMarks) * weightage;
                                userEntry.obtainedWeightage += questionWeightage;
        
                                userEntry.questionsDetails.push({
                                    id: assessmentResource.id,
                                    statement: assessmentResource.statement,
                                    answer: answer.answer,
                                    totalMarks: assessmentResource.totalMarks,
                                    obtainedMarks: obtainedMarks
                                });
                            }
                        }
                    });
                }
            });
        });
        
        // Calculate the average obtained weightage and student distribution for each standard
        standardsMap?.forEach(standardEntry => {
            const totalObtainedWeightage = standardEntry.usersWeightage.reduce((acc, user) => acc + user.obtainedWeightage, 0);
            standardEntry.averageObtainedWeightage = totalObtainedWeightage / classItem.classroomStudents.length;
        
            // Check if averageObtainedWeightage is null and set it to 0
            if (isNaN(standardEntry.averageObtainedWeightage)) {
                standardEntry.averageObtainedWeightage = 0;
            }
        });
        
        // Calculate the total obtained score for each student and the overall average
        const studentsData = classItem.classroomStudents?.map((student, index) => {
            const totalObtainedScore = Array.from(standardsMap.values()).reduce((acc, standardEntry) => {
                const userEntry = standardEntry.usersWeightage.find(u => u.userId === student.student.id);
                return acc + (userEntry ? userEntry.obtainedWeightage : 0);
            }, 0);

            const studentIndex = index + 1 + offset;

            return {
                index: studentIndex,
                id: student.student.id,
                name: student.student.name,
                email: student.student.email,
                image: student.student.image,
                performance: totalObtainedScore / standardsMap.size,
                gradeId: classItem.id,
                grade: classItem.name,
            };
        });

        const countAllClassroomStudents = await ClassroomStudent.count({
            where: {
                classroomId: classroomId
            }
        })

        const totalPages = Math.ceil(countAllClassroomStudents / limit);
        
        // let avgObtainedWeightage = 0;
        // if (studentsData.length > 0) {
        //     // Calculate total obtained score for all students and the overall average
        //     const totalObtainedScoreSum = studentsData.reduce((acc, student) => {
        //         // Check if student.totalObtainedScore is a number, if not, add 0 to the accumulator
        //         return acc + (isNaN(student.totalObtainedScore) ? 0 : student.totalObtainedScore);
        //     }, 0);
        //     avgObtainedWeightage = classItem.classroomStudents.length > 0 ? totalObtainedScoreSum / classItem.classroomStudents.length : 0;
        // }
        
        // // Calculate total weightage of all standards where access date <= today
        // const totalWeightageOfStandards = classItem.classroomCourses.reduce((acc, course) => {
        //     const standard = course.standard;
        //     if (standard && standard.dailyUploads && standard.dailyUploads.length > 0) {
        //         const totalWeightage = standard.dailyUploads
        //             .filter(upload => new Date(upload.accessDate) <= today)
        //             .reduce((sum, upload) => sum + upload.weightage, 0);
        //         return acc + totalWeightage;
        //     }
        //     return acc;
        // }, 0);
        
        // // Calculate the average weightage per standard
        // const numberOfStandards = classItem.classroomCourses.length;
        // const averageWeightagePerStandard = numberOfStandards > 0 ? totalWeightageOfStandards / numberOfStandards : 0;
        
        const transformedData = {
            classId: classItem.id,
            className: classItem.name,
            totalPages,
            studentsData,
            // avgObtainedWeightage,
            // avgTotalWeightage: averageWeightagePerStandard
        };

        return {
            code: 200,
            data: transformedData
        };
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
        if (student.school_id !== schoolId) {
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

const updateTeacherClassrooms = async ({ schoolId, teacherId, classroomIds }) => {
    try {
        const teacher = await User.findOne({ where: { id: teacherId, school_id: schoolId } });
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
