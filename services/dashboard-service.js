const { Sequelize, Op, fn, col, literal } = require("sequelize");
const { logger } = require("../Logs/logger.js");
// @ts-ignore
const { sequelize, Classroom, Standard, ClassroomCourses, ClassroomStudent, User, DailyUpload, Resource, Video, VideoTracking, Question, VideoQuestionAnswer, AssessmentResourcesDetail, AssessmentAnswer, DailyProgress, Enrollment } = require("../models/index.js");
const { RESOURCE_TYPES, CLASSROOM_STATUS } = require("../utils/enumTypes.js");

function canSubmitAssessment(startDate, accessibleDay, daysToAdd) {
    accessibleDay = Number(accessibleDay);
    daysToAdd = Number(daysToAdd);
    const uploadDateObj = new Date(startDate);
    uploadDateObj.setDate(uploadDateObj.getDate() + accessibleDay + daysToAdd + 1);
    const today = new Date();
    if (today > uploadDateObj) {
        return false;
    }
    return true;
}

function isReleased(startDate, accessibleDay) {
    accessibleDay = Number(accessibleDay);
    const accessibleDate = new Date(startDate);
    accessibleDate.setDate(accessibleDate.getDate() + accessibleDay);
    const today = new Date();
    const released = today >= accessibleDate;

    // Format the date to 'YYYY-MM-DD'
    const formattedDate = accessibleDate.toISOString().split('T')[0];

    return {
        released: released,
        date: formattedDate
    };
}

// const getTeacherDashboardSummaries = async ({ teacherId }) => {
//     try {
//         const classrooms = await Classroom.findAll({
//             where: { teacherId },
//             include: [{
//                 model: ClassroomStudent,
//                 as: 'classroomStudents'
//             }]
//         });

//         const totalClassrooms = classrooms.length;
//         const totalStudents = classrooms?.reduce((total, classroom) => total + classroom.classroomStudents.length, 0);

//         const studentCounts = await ClassroomStudent.findAll({
//             attributes: [
//                 [fn("date_trunc", "year", col("createdAt")), "year"],
//                 [fn("date_trunc", "month", col("createdAt")), "month"],
//                 [fn("count", "*"), "count"],
//             ],
//             where: {
//                 classroomId: classrooms?.map(classroom => classroom.id)
//             },
//             group: ["year", "month"],
//             order: [
//                 [fn("date_trunc", "year", col("createdAt")), "ASC"],
//                 [fn("date_trunc", "month", col("createdAt")), "ASC"]
//             ],
//             raw: true,
//         });

//         // Transform the data into the desired format
//         const formattedResults = studentCounts?.map(row => ({
//             year: new Date(row.year).getFullYear(),
//             month: new Date(row.month).getMonth() + 1, // Months are 0-indexed in JavaScript
//             count: parseInt(row.count, 10)
//         }));

//         // Calculate cumulative count
//         let cumulativeCount = 0;
//         const cumulativeResults = formattedResults?.map(row => {
//             cumulativeCount += row.count;
//             return {
//                 year: row.year,
//                 month: row.month,
//                 count: cumulativeCount
//             };
//         });

//         const data = await Classroom.findAll({
//             where: { status: CLASSROOM_STATUS.ACTIVE, teacherId: teacherId },
//             attributes: ["id", "name"],
//             include: [
//                 {
//                     model: ClassroomCourses,
//                     as: 'classroomCourses',
//                     attributes: ["id"],
//                     include: [{
//                         model: Standard,
//                         as: 'standard',
//                         attributes: ['id', 'name'],
//                         include: [{
//                             model: DailyUpload,
//                             as: 'dailyUploads',
//                             attributes: ['id', 'accessDate', 'weightage'],
//                             where: {
//                                 weightage: {
//                                     [Op.gt]: 0
//                                 }
//                             },
//                             required: true,
//                             separate: true,
//                             include: [{
//                                 model: Resource,
//                                 as: 'resource',
//                                 attributes: ['id', 'name', 'type', 'topic', 'url'],
//                                 include: [
//                                     {
//                                         model: Video,
//                                         as: 'video',
//                                         attributes: ['id'],
//                                         include: [{
//                                             separate: true,
//                                             model: Question,
//                                             as: 'questions',
//                                             required: false,
//                                             attributes: ['id', 'totalMarks'],
//                                         }]
//                                     },
//                                     {
//                                         model: AssessmentResourcesDetail,
//                                         as: 'AssessmentResourcesDetail',
//                                         attributes: ['id', 'totalMarks', 'deadline']
//                                     }
//                                 ]
//                             }]
//                         }]
//                     }],
//                 },
//                 {
//                     model: ClassroomStudent,
//                     as: 'classroomStudents',
//                     attributes: ['id', 'classroomId', 'studentId'],
//                     include: [{
//                         model: User,
//                         as: 'student',
//                         attributes: ['id', 'name', 'email', 'image'],
//                         include: [
//                             {
//                                 model: AssessmentAnswer,
//                                 attributes: ['id', 'userId', 'standardId', 'obtainedMarks'],
//                                 separate: true,
//                                 required: false,
//                                 include: [{
//                                     model: AssessmentResourcesDetail,
//                                     as: 'assessmentResourcesDetail',
//                                     attributes: ['id', 'totalMarks', 'deadline', 'resourceId'],
//                                     include: [{
//                                         model: Resource,
//                                         as: 'resource',
//                                         attributes: ['id', 'name', 'type', 'topic', 'url'],
//                                         include: [{
//                                             model: DailyUpload,
//                                             as: 'DailyUpload',
//                                             attributes: ['weightage', 'accessDate', 'standardId', 'resourceId']
//                                         }]
//                                     }]
//                                 }]
//                             },
//                             {
//                                 model: VideoQuestionAnswer,
//                                 attributes: ['id', 'userId', 'obtainedMarks'],
//                                 separate: true,
//                                 required: false,
//                                 include: [{
//                                     model: Question,
//                                     as: 'question',
//                                     attributes: ['id', 'totalMarks'],
//                                     include: [
//                                         {
//                                             model: Video,
//                                             as: 'video',
//                                             attributes: ['id', 'resourceId'],
//                                             include: [{
//                                                 model: Resource,
//                                                 as: 'resource',
//                                                 attributes: ['id', 'name', 'type', 'topic', 'url'],
//                                                 include: [{
//                                                     model: DailyUpload,
//                                                     as: 'DailyUpload',
//                                                     attributes: ['weightage', 'accessDate', 'standardId', 'resourceId']
//                                                 }]
//                                             }]
//                                         }
//                                     ]
//                                 }]
//                             }
//                         ]
//                     }]
//                 }
//             ],
//         });
//         // Current date for comparison
//         const today = new Date();
//         // today.setHours(0, 0, 0, 0);

//         const transformedData = data?.map(classItem => {
//             const standardsMap = new Map();
//             const currentDate = new Date();

//             // Iterate over each course in the classroom to map standards
//             classItem.classroomCourses?.forEach(course => {
//                 const standard = course.standard;
//                 if (standard) {
//                     // If the standard is not already in the map, add it
//                     if (!standardsMap.has(standard.id)) {
//                         standardsMap.set(standard.id, {
//                             standardId: standard.id,
//                             standardName: standard.name,
//                             currentTotalWeightage: 0,
//                             usersWeightage: [],
//                             studentWeightageDistribution: {
//                                 '0-25': 0,
//                                 '25-50': 0,
//                                 '50-75': 0,
//                                 '75-100': 0
//                             },
//                             averageObtainedWeightage: 0  // Default value set to 0
//                         });
//                     }

//                     const standardEntry = standardsMap.get(standard.id);

//                     // Calculate the total weightage for the standard based on daily uploads up to today
//                     if (standard.dailyUploads && standard.dailyUploads.length > 0) {
//                         standardEntry.currentTotalWeightage += standard.dailyUploads
//                             .filter(upload => new Date(upload.accessDate) <= currentDate)
//                             .reduce((acc, upload) => acc + upload.weightage, 0);
//                     }
//                 }
//             });

//             // Iterate over each student in the classroom to calculate obtained weightage
//             classItem.classroomStudents?.forEach(student => {
//                 classItem.classroomCourses?.forEach(course => {
//                     const standard = course.standard;
//                     if (standard) {
//                         const standardEntry = standardsMap.get(standard.id);

//                         // Ensure the student is present in the usersWeightage array
//                         let userEntry = standardEntry.usersWeightage.find(u => u.userId === student.student.id);
//                         if (!userEntry) {
//                             userEntry = {
//                                 userId: student.student.id,
//                                 userName: student.student.name,
//                                 obtainedWeightage: 0,
//                                 questionsDetails: []
//                             };
//                             standardEntry.usersWeightage.push(userEntry);
//                         }

//                         // Track total marks and obtained marks for video questions
//                         const videoWeightages = new Map();
//                         student.student.VideoQuestionAnswers?.forEach(answer => {
//                             const videoQuestion = answer.question;
//                             if (videoQuestion.video && videoQuestion.video.resource.DailyUpload) {
//                                 const dailyUpload = videoQuestion.video.resource.DailyUpload;
//                                 if (new Date(dailyUpload.accessDate) <= currentDate && dailyUpload.standardId === standard.id) {
//                                     const videoId = videoQuestion.video.id;
//                                     if (!videoWeightages.has(videoId)) {
//                                         videoWeightages.set(videoId, {
//                                             totalMarks: 0,
//                                             obtainedMarks: 0,
//                                             weightage: dailyUpload.weightage
//                                         });
//                                     }
//                                     const questionTotalMarks = videoQuestion.totalMarks;
//                                     const questionObtainedMarks = Math.max(answer.obtainedMarks, 0);
//                                     videoWeightages.get(videoId).totalMarks += questionTotalMarks;
//                                     videoWeightages.get(videoId).obtainedMarks += questionObtainedMarks;

//                                     userEntry.questionsDetails.push({
//                                         id: videoQuestion.id,
//                                         statement: videoQuestion.statement,
//                                         answer: answer.answer,
//                                         totalMarks: questionTotalMarks,
//                                         obtainedMarks: questionObtainedMarks
//                                     });
//                                 }
//                             }
//                         });

//                         // Calculate weightage for each video based on total marks and obtained marks of its questions
//                         videoWeightages.forEach((video, videoId) => {
//                             const weightage = video.weightage;
//                             const totalMarks = video.totalMarks;
//                             const obtainedMarks = video.obtainedMarks;
//                             const videoWeightage = (obtainedMarks / totalMarks) * weightage;
//                             userEntry.obtainedWeightage += videoWeightage;
//                         });

//                         // Calculate obtained weightage from assessment answers
//                         student.student.AssessmentAnswers?.forEach(answer => {
//                             const assessmentResource = answer.assessmentResourcesDetail;
//                             if (assessmentResource.resource.DailyUpload) {
//                                 const dailyUpload = assessmentResource.resource.DailyUpload;
//                                 if (new Date(dailyUpload.accessDate) <= currentDate && dailyUpload.standardId === standard.id) {
//                                     const weightage = dailyUpload.weightage;
//                                     const obtainedMarks = Math.max(answer.obtainedMarks, 0);
//                                     const questionWeightage = (obtainedMarks / assessmentResource.totalMarks) * weightage;
//                                     userEntry.obtainedWeightage += questionWeightage;

//                                     userEntry.questionsDetails.push({
//                                         id: assessmentResource.id,
//                                         statement: assessmentResource.statement,
//                                         answer: answer.answer,
//                                         totalMarks: assessmentResource.totalMarks,
//                                         obtainedMarks: obtainedMarks
//                                     });
//                                 }
//                             }
//                         });
//                     }
//                 });
//             });

//             // Calculate the average obtained weightage and student distribution for each standard
//             standardsMap?.forEach(standardEntry => {
//                 const totalObtainedWeightage = standardEntry.usersWeightage.reduce((acc, user) => acc + user.obtainedWeightage, 0);
//                 standardEntry.averageObtainedWeightage = totalObtainedWeightage / classItem.classroomStudents.length;

//                 // Check if averageObtainedWeightage is null and set it to 0
//                 if (isNaN(standardEntry.averageObtainedWeightage)) {
//                     standardEntry.averageObtainedWeightage = 0;
//                 }

//                 // Calculate student distribution for obtained weightage ranges
//                 standardEntry.usersWeightage?.forEach(user => {
//                     if (user.obtainedWeightage < 25) {
//                         standardEntry.studentWeightageDistribution['0-25']++;
//                     } else if (user.obtainedWeightage < 50) {
//                         standardEntry.studentWeightageDistribution['25-50']++;
//                     } else if (user.obtainedWeightage < 75) {
//                         standardEntry.studentWeightageDistribution['50-75']++;
//                     } else {
//                         standardEntry.studentWeightageDistribution['75-100']++;
//                     }
//                 });
//             });

//             // Calculate the total obtained score for each student and the overall average
//             const studentsData = classItem.classroomStudents?.map(student => {
//                 const totalObtainedScore = Array.from(standardsMap.values()).reduce((acc, standardEntry) => {
//                     const userEntry = standardEntry.usersWeightage.find(u => u.userId === student.student.id);
//                     return acc + (userEntry ? userEntry.obtainedWeightage : 0);
//                 }, 0);
//                 return {
//                     userId: student.student.id,
//                     userName: student.student.name,
//                     userEmail: student.student.email,
//                     image: student.student.image,
//                     totalObtainedScore: totalObtainedScore / standardsMap.size,
//                     classId: classItem.id,
//                     className: classItem.name,
//                 };
//             });

//             let avgObtainedWeightage = 0
//             if (studentsData.length > 0) {
//                 // Calculate total obtained score for all students and the overall average
//                 const totalObtainedScoreSum = studentsData.reduce((acc, student) => {
//                     // Check if student.totalObtainedScore is a number, if not, add 0 to the accumulator
//                     return acc + (isNaN(student.totalObtainedScore) ? 0 : student.totalObtainedScore);
//                 }, 0);
//                 avgObtainedWeightage = classItem.classroomStudents.length > 0 ? totalObtainedScoreSum / classItem.classroomStudents.length : 0;
//             }

//             // Calculate total weightage of all standards where access date <= today
//             const totalWeightageOfStandards = classItem.classroomCourses.reduce((acc, course) => {
//                 const standard = course.standard;
//                 if (standard && standard.dailyUploads && standard.dailyUploads.length > 0) {
//                     const totalWeightage = standard.dailyUploads
//                         .filter(upload => new Date(upload.accessDate) <= today)
//                         .reduce((sum, upload) => sum + upload.weightage, 0);
//                     return acc + totalWeightage;
//                 }
//                 return acc;
//             }, 0);

//             // Calculate the average weightage per standard
//             const numberOfStandards = classItem.classroomCourses.length;
//             const averageWeightagePerStandard = numberOfStandards > 0 ? totalWeightageOfStandards / numberOfStandards : 0;

//             return {
//                 classId: classItem.id,
//                 className: classItem.name,
//                 standardList: Array.from(standardsMap.values()),
//                 studentsData,
//                 avgObtainedWeightage,
//                 avgTotalWeightage: averageWeightagePerStandard
//             };
//         });

//         return {
//             code: 200,
//             data: {
//                 totalClassrooms,
//                 totalStudents,
//                 usersJoining: cumulativeResults,
//                 students: transformedData.flatMap(classItem => classItem.studentsData).filter(student => student !== undefined),
//                 avgObtainedWeightage: (transformedData.reduce((acc, classItem) => acc + classItem.avgObtainedWeightage, 0) / transformedData.length).toFixed(1),
//                 avgTotalWeightage: (transformedData.reduce((acc, classItem) => acc + classItem.avgTotalWeightage, 0) / transformedData.length).toFixed(1)
//             }
//         };
//     } catch (error) {
//         console.log('\n\n\n\n', error);
//         logger.error(error?.message || 'An error occurred while getting total classrooms and students of teacher for teacher dahsboard');
//         return { code: 500 };
//     }
// }

const getTeacherDashboardSummaries = async ({ teacherId }) => {
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

        const totalClassrooms = classrooms.length;
        const totalStudents = classrooms?.reduce((total, classroom) => total + classroom?.classroomStudents?.length, 0);

        const studentCounts = await ClassroomStudent.findAll({
            attributes: [
                [fn("date_trunc", "year", col("createdAt")), "year"],
                [fn("date_trunc", "month", col("createdAt")), "month"],
                [fn("count", "*"), "count"],
            ],
            where: {
                classroomId: classrooms?.map(classroom => classroom.id)
            },
            group: ["year", "month"],
            order: [
                [fn("date_trunc", "year", col("createdAt")), "ASC"],
                [fn("date_trunc", "month", col("createdAt")), "ASC"]
            ],
            raw: true,
        });

        // Transform the data into the desired format
        const formattedResults = studentCounts?.map(row => ({
            year: new Date(row.year).getFullYear(),
            month: new Date(row.month).getMonth() + 1, // Months are 0-indexed in JavaScript
            count: parseInt(row.count, 10)
        }));

        // Calculate cumulative count
        let cumulativeCount = 0;
        const cumulativeResults = formattedResults?.map(row => {
            cumulativeCount += row.count;
            return {
                year: row.year,
                month: row.month,
                count: cumulativeCount
            };
        });

        const teacherClassroomResults = await sequelize.query(`
            SELECT
                c.id AS classroom_id,
                c.name AS classroom_name,
                u.id AS student_id,
                u.name AS student_name,
                u.email AS student_email,
                u.image AS student_image,
                COUNT(e.id) AS standard_count,
                SUM(e.result) AS total_performance,
                CASE 
                    WHEN COUNT(e.id) > 0 THEN ROUND(SUM(e.result)::numeric / COUNT(e.id), 2)
                    ELSE 0 
                END AS class_result
            FROM
                public."Classrooms" AS c
            INNER JOIN
                public."Enrollments" AS e
                ON c.id = e."classroomId"
            INNER JOIN
                public."Users" AS u
                ON e."studentId" = u.id
            WHERE
                c."teacherId" = '${teacherId}' AND c."status" = 'active'
            GROUP BY
                c.id, c.name, u.id, u.name, u.email, u.image
            ORDER BY
                u.name ASC
        `,);
        const enrollments = teacherClassroomResults[0];

        const data = await Classroom.findAll({
            where: { status: CLASSROOM_STATUS.ACTIVE, teacherId: teacherId },
            attributes: ["id", "name"],
            include: [
                {
                    model: ClassroomCourses,
                    as: 'classroomCourses',
                    attributes: ['id', 'startDate'],
                    include: [{
                        model: Standard,
                        as: 'standard',
                        attributes: ['id', 'name'],
                        include: [{
                            model: DailyUpload,
                            as: 'dailyUploads',
                            attributes: ['id', 'accessibleDay', 'weightage'],
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
                    }],
                },
            ],
        });

        // Current date for comparison
        const today = new Date();
        
        // handle each class
        const transformedData = data?.map(classItem => {
            const standardsMap = new Map();

            // Iterate over each course/standard in the classroom to handle current total weightages in class
            classItem.classroomCourses?.forEach(course => {
                const standard = course.standard;
                if (standard) {
                    // If the standard is not already in the map, add it
                    if (!standardsMap.has(standard.id)) {
                        standardsMap.set(standard.id, {
                            standardId: standard.id,
                            standardName: standard.name,
                            currentTotalWeightage: 0,
                        });
                    }

                    const standardEntry = standardsMap.get(standard.id);

                    // Calculate the total weightage for the standard based on daily uploads up to today
                    if (standard.dailyUploads && standard.dailyUploads.length > 0) {
                        standardEntry.currentTotalWeightage += standard.dailyUploads
                            .filter((upload) => {
                                const accessibleDate = new Date(course.startDate);
                                accessibleDate.setDate(accessibleDate.getDate() + upload.accessibleDay);
                                return (today >= accessibleDate)
                            })
                            .reduce((acc, upload) => acc + upload.weightage, 0);
                    }

                }
            });

            const standardsArray = Array.from(standardsMap.values());

            // Calculate total and average weightage for the classroom
            const totalWeightage = standardsArray.reduce((sum, standard) => sum + standard.currentTotalWeightage, 0);
            const numberOfStandards = standardsArray.length;
            const averageWeightage = numberOfStandards > 0 ? totalWeightage / numberOfStandards : 0;

            // Filter enrollments for the current classroom
            const currentClassEnrollments = enrollments.filter(enrollment => enrollment.classroom_id === classItem.id);

            // Calculate average result for the classroom
            const avgResult = currentClassEnrollments.length > 0
                ? currentClassEnrollments.reduce((sum, enrollment) => sum + enrollment.class_result, 0) / currentClassEnrollments.length
                : 0;

            return {
                classId: classItem.id,
                className: classItem.name,
                avgObtainedWeightage: avgResult.toFixed(2),
                avgTotalWeightage: averageWeightage.toFixed(2),
            };
        });

        // need at max 5 students for dashboard
        const students = enrollments.slice(0, 5).map(enrollment => ({
            userId: enrollment.student_id,
            userName: enrollment.student_name,
            userEmail: enrollment.student_email,
            image: enrollment.student_image,
            totalObtainedScore: enrollment.total_performance,
            classId: enrollment.classroom_id,
            className: enrollment.classroom_name,
        }));

        return {
            code: 200,
            data: {
                totalClassrooms,
                totalStudents,
                usersJoining: cumulativeResults,
                students: students,
                avgObtainedWeightage: transformedData.length > 0 ? (transformedData.reduce((acc, classItem) => acc + parseFloat(classItem.avgObtainedWeightage), 0) / transformedData.length).toFixed(1) : 0,
                avgTotalWeightage: transformedData.length > 0 ? (transformedData.reduce((acc, classItem) => acc + parseFloat(classItem.avgTotalWeightage), 0) / transformedData.length).toFixed(1) : 0
            }
        };
    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting total classrooms and students of teacher for teacher dahsboard');
        return { code: 500 };
    }
}

const getAdminDashboardSummaries = async () => {
    try {
        const users = await User.findAll({});

        const userCountData = await User.findAll({
            attributes: [
                [fn("date_trunc", "year", col("createdAt")), "year"],
                [fn("date_trunc", "month", col("createdAt")), "month"],
                [fn("count", "*"), "count"],
            ],
            group: ["year", "month"],
            order: [
                [literal("date_trunc('year', \"createdAt\")"), "ASC"],
                [literal("date_trunc('month', \"createdAt\")"), "ASC"]
            ],
            raw: true,
        });

        // Transform the data into the desired format
        const formattedResults = userCountData.map(row => ({
            year: new Date(row.year).getFullYear(),
            month: new Date(row.month).getMonth() + 1, // Months are 0-indexed in JavaScript
            count: parseInt(row.count, 10)
        }));

        // Calculate cumulative count
        let cumulativeCount = 0;
        const cumulativeResults = formattedResults.map(row => {
            cumulativeCount += row.count;
            return {
                year: row.year,
                month: row.month,
                count: cumulativeCount
            };
        });

        const videos = await Resource.findAll({
            where: { type: RESOURCE_TYPES.VIDEO },
        });

        const resources = await Resource.findAll({
            where: { type: { [Op.not]: RESOURCE_TYPES.VIDEO } },
        });

        const result = {
            usersJoining: cumulativeResults,
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

// const getStudentDashboardSummaries = async ({ studentId }) => {
//     try {
//         // const classrooms = await ClassroomStudent.findOne({
//         //     where: { studentId },
//         //     include: [{
//         //         model: Classroom,
//         //         as: 'classroom',
//         //         where: { status : CLASSROOM_STATUS.ACTIVE },
//         //         attributes: ['name'],
//         //         required: true,
//         //         include: [{
//         //             model: ClassroomCourses,
//         //             as: 'classroomCourses',
//         //             attributes: ['id'],
//         //             include: [{
//         //                 model: Standard,
//         //                 as: 'standard',
//         //                 attributes: ['id', 'name', 'courseLength'],
//         //                 include: [{
//         //                     model: DailyUpload,
//         //                     as: 'dailyUploads',
//         //                     separate: true,
//         //                     attributes: ['id', 'resourceId'],
//         //                     include: [{
//         //                         model: Resource,
//         //                         as: 'resource',
//         //                         attributes: ['id', 'type'],
//         //                         include: [{
//         //                             model: Video,
//         //                             as: 'video',
//         //                             attributes: ['id','thumbnailURL', 'topics', 'duration', 'resourceId'],
//         //                             include: [
//         //                                 {
//         //                                     model: VideoTracking,
//         //                                     as: 'videoTrackings',
//         //                                     separate: true,
//         //                                     where: {saved: true},
//         //                                     attributes: ['last_seen_time', 'videoId']
//         //                                 },
//         //                                 {
//         //                                     model: Question,
//         //                                     as: 'questions',
//         //                                     separate: true,
//         //                                     attributes: ['id']
//         //                                 }
//         //                             ]
//         //                         }]
//         //                     }]
//         //                 }]
//         //             }]
//         //         }]
//         //     }]
//         // });

//         const existingStudent = await User.findByPk(studentId)
//         if (!existingStudent) {
//             return { code: 404, message: 'Student not found' };
//         }

//         // First, find the classroom student
//         const classroomStudent = await ClassroomStudent.findOne({
//             where: { studentId },
//             include: [{
//                 model: Classroom,
//                 as: 'classroom',
//                 where: { status: CLASSROOM_STATUS.ACTIVE },
//                 required: true
//             }]
//         });

//         if (!classroomStudent) {
//             const result = {
//                 studentName: existingStudent.name,
//                 standardsCount: 0,
//                 classroomName: '',
//                 standardsData: [],
//                 videosData: [],
//                 averageObtainedWeightage: 0,
//                 averageTotalWeightage: 0,
//                 assignmentsSolved: 0,
//                 assignmentsLeft: 0,
//                 assignmentsMissed: 0,
//             };

//             return { code: 200, data: result };
//         }

//         // Then, when you need the classroom courses, you can load them
//         const classroomCourses = await ClassroomCourses.findAll({
//             where: { classroomId: classroomStudent?.classroom.id },
//             include: [{
//                 model: Standard,
//                 as: 'standard'
//             }]
//         });

//         // Count of standards
//         const standardsCount = classroomCourses?.length;

//         // Classroom name
//         const classroomName = classroomStudent?.classroom.name;

//         // For each standard, get its name and count of video and non-video resources
//         const standardsData = await Promise.all(classroomCourses?.slice(0, Math.min(3, classroomCourses.length)).map(async (course) => {
//             const dailyUploads = await DailyUpload.findAll({
//                 where: { standardId: course.standard.id },
//                 include: [{
//                     model: Resource,
//                     as: 'resource'
//                 }]
//             });

//             const videoResourcesCount = dailyUploads?.filter(upload => upload.resource.type === 'video')?.length || 0;
//             const nonVideoResourcesCount = dailyUploads?.length - videoResourcesCount;

//             return {
//                 standardId: course.standard.id,
//                 standardName: course.standard.name,
//                 videoResourcesCount,
//                 nonVideoResourcesCount
//             };
//         }));

//         // // Fetch all daily uploads for the classroom student
//         // const allDailyVideoUploads = await DailyUpload.findAll({
//         //     where: { standardId: classroomCourses?.map(course => course.standard.id) },
//         //     include: [{
//         //         model: Resource,
//         //         as: 'resource',
//         //         include: [{
//         //             model: Video,
//         //             as: 'video',
//         //             include: [
//         //                 {
//         //                     model: VideoTracking,
//         //                     as: 'videoTrackings',
//         //                     where: { saved: true, studentId: studentId },
//         //                     required: true
//         //                 },
//         //                 {
//         //                     model: Question,
//         //                     as: 'questions',
//         //                     required: false
//         //                 }
//         //             ],
//         //             required: true
//         //         }],
//         //         required: true
//         //     }],
//         //     order: [['createdAt', 'DESC']],
//         //     limit: 6
//         // });

//         // // For each video, get the required data
//         // const videosData = allDailyVideoUploads?.map(upload => ({
//         //     standardId: upload?.standardId,
//         //     videoId: upload.resource?.video?.id,
//         //     videoName: upload.resource?.name,
//         //     questionsCount: upload.resource?.video?.questions?.length,
//         //     topicsCount: Object.keys(upload.resource?.video?.topics).length,
//         //     lastSeenTime: upload.resource?.video?.videoTrackings?.length > 0 ? upload.resource?.video?.videoTrackings[0]?.last_seen_time : null,
//         //     duration: upload.resource?.video?.duration,
//         //     thumbnailURL: upload.resource?.video?.thumbnailURL,
//         //     completed: upload.resource.video.videoTrackings[0].watchedCompletely,
//         // }));

//         const data = await ClassroomStudent.findOne({
//             where: {
//                 studentId: studentId
//             },
//             attributes: ["id"],
//             include: [
//                 {
//                     model: DailyProgress,
//                     attributes: ["id", "classroomStudentId", "obtainedWeightage", "totalWeightage", "date"],
//                     required: false
//                 },
//                 {
//                     model: Classroom,
//                     as: 'classroom',
//                     where: { status: CLASSROOM_STATUS.ACTIVE },
//                     attributes: ["id", "name"],
//                     include: [{
//                         model: ClassroomCourses,
//                         as: 'classroomCourses',
//                         attributes: ["id"],
//                         include: [{
//                             model: Standard,
//                             as: 'standard',
//                             attributes: ["id", "name"],
//                             include: [{
//                                 model: DailyUpload,
//                                 as: 'dailyUploads',
//                                 attributes: ['id', 'accessDate', 'weightage'],
//                                 where: {
//                                     weightage: {
//                                         [Op.gt]: 0
//                                     }
//                                 },
//                                 required: true,
//                                 separate: true,
//                                 include: [{
//                                     model: Resource,
//                                     as: 'resource',
//                                     attributes: ['id', 'name', 'type', 'topic', 'url'],
//                                     include: [
//                                         {
//                                             model: Video,
//                                             as: 'video',
//                                             attributes: ['id'],
//                                             include: [{
//                                                 separate: true,
//                                                 model: Question,
//                                                 as: 'questions',
//                                                 required: false,
//                                                 attributes: ['id', 'totalMarks'],
//                                                 include: [{
//                                                     separate: true,
//                                                     model: VideoQuestionAnswer,
//                                                     as: 'answers',
//                                                     where: { 
//                                                         userId: studentId,
//                                                         classroomId: classroomStudent.classroom.id
//                                                     },
//                                                     required: false,
//                                                     attributes: ['obtainedMarks']
//                                                 }]
//                                             }]
//                                         },
//                                         {
//                                             model: AssessmentResourcesDetail,
//                                             as: 'AssessmentResourcesDetail',
//                                             attributes: ['id', 'totalMarks', 'deadline'],
//                                             include: [{
//                                                 separate: true,
//                                                 model: AssessmentAnswer,
//                                                 as: 'assessmentAnswers',
//                                                 where: { 
//                                                     userId: studentId,
//                                                     classroomId: classroomStudent.classroom.id
//                                                 },
//                                                 attributes: ['obtainedMarks', 'answerURL'],
//                                                 required: false,
//                                             }]
//                                         }
//                                     ]
//                                 }]
//                             }]
//                         }],
//                     }],
//                 }
//             ],
//         });

//         // Current date for comparison
//         const today = new Date();

//         const plainData = await data?.get({ plain: true });

//         if (!plainData || !plainData.classroom) {
//             const result = {
//                 studentName: existingStudent.name,
//                 standardsCount: 0,
//                 classroomName: '',
//                 standardsData: [],
//                 videosData: [],
//                 averageObtainedWeightage: 0,
//                 averageTotalWeightage: 0,
//                 assignmentsSolved: 0,
//                 assignmentsLeft: 0,
//                 assignmentsMissed: 0,
//             };
//             return {
//                 code: 200,
//                 data: result
//             };
//         }
//         if (!plainData.classroom.classroomCourses || plainData.classroom.classroomCourses.length <= 0) {
//             const result = {
//                 studentName: existingStudent.name,
//                 standardsCount: 0,
//                 classroomName: plainData.classroom.name,
//                 standardsData: [],
//                 videosData: [],
//                 averageObtainedWeightage: 0,
//                 averageTotalWeightage: 0,
//                 assignmentsSolved: 0,
//                 assignmentsLeft: 0,
//                 assignmentsMissed: 0,
//             };
//             return {
//                 code: 200,
//                 data: result
//             };
//         }

//         let assignmentsSolved = 0;
//         let assignmentsLeft = 0;
//         let assignmentsMissed = 0;

//         const transformedData = data?.classroom?.classroomCourses?.map(course => {
//             const standard = course?.standard;
//             let totalWeightage = 0;
//             let obtainedWeightage = 0;

//             standard?.dailyUploads?.forEach(upload => {
//                 let totalObtainedMarks = 0;
//                 let totalPossibleMarks = 0;
//                 const accessDate = new Date(upload.accessDate);

//                 // Only consider uploads with accessDate < today
//                 if (accessDate < today) {
//                     totalWeightage += upload.weightage;

//                     // Process resource's video questions
//                     if (upload.resource.video) {
//                         totalPossibleMarks = upload.resource.video?.questions?.reduce((total, question) => {
//                             return total + question.totalMarks;
//                         }, 0);
//                         upload.resource.video.questions.forEach(question => {
//                             question?.answers?.forEach(answer => {
//                                 totalObtainedMarks += answer.obtainedMarks === -1 ? 0 : answer.obtainedMarks;
//                             });
//                         });
//                     }

//                     // Process resource's assessment answers
//                     if (upload.resource.AssessmentResourcesDetail) {
//                         upload.resource.AssessmentResourcesDetail.assessmentAnswers.forEach(answer => {
//                             totalObtainedMarks += answer?.obtainedMarks === -1 ? 0 : answer?.obtainedMarks;
//                         });
//                         totalPossibleMarks += upload.resource.AssessmentResourcesDetail?.totalMarks || 0;
//                     }
//                     obtainedWeightage += totalPossibleMarks > 0 ? (totalObtainedMarks / totalPossibleMarks) * upload.weightage : upload.weightage;

//                     if (upload.resource.type === RESOURCE_TYPES.ASSIGNMENT) {
//                         if (upload.resource.AssessmentResourcesDetail.assessmentAnswers.length > 0) {
//                             assignmentsSolved++;
//                         } 
//                         else if (upload.resource.AssessmentResourcesDetail.assessmentAnswers.length === 0 && canSubmitAssessment(upload.accessDate, upload.resource.AssessmentResourcesDetail.deadline) === false) {
//                             assignmentsMissed++;
//                         } 
//                         else {
//                             assignmentsLeft++;
//                         }
//                     }
//                 }
//             })
//             return {
//                 standardId: standard.id,
//                 standardName: standard.name,
//                 totalWeightage: parseFloat(totalWeightage.toFixed(1)),
//                 obtainedWeightage: parseFloat(obtainedWeightage.toFixed(1))
//             };
//         })

//         // Calculate average total weightage
//         const totalTotalWeightage = transformedData?.reduce((total, entry) => {
//             return total + entry.totalWeightage;
//         }, 0);
//         const averageTotalWeightage = transformedData?.length > 0 ? totalTotalWeightage / transformedData.length : 0;

//         // Calculate average obtained weightage
//         const totalObtainedWeightage = transformedData?.reduce((total, entry) => {
//             return total + entry.obtainedWeightage;
//         }, 0);
//         const averageObtainedWeightage = transformedData?.length > 0 ? totalObtainedWeightage / transformedData.length : 0;

//         const result = {
//             studentName: existingStudent.name,
//             standardsCount,
//             classroomName,
//             standardsData,
//             // videosData,
//             averageObtainedWeightage,
//             averageTotalWeightage,
//             assignmentsSolved,
//             assignmentsLeft,
//             assignmentsMissed
//         };

//         return { code: 200, data: result };

//     } catch (error) {
//         console.log('\n\n\n\n', error);
//         logger.error(error?.message || 'An error occurred while getting total classrooms and courses of student for student dahsboard');
//         return { code: 500 };
//     }
// }

const getStudentDashboardSummaries = async ({ studentId }) => {
    try {
        const existingStudent = await User.findByPk(studentId)
        if (!existingStudent) {
            return { code: 404, message: 'Student not found' };
        }

        // First, find the classroom student
        const classroomStudent = await ClassroomStudent.findOne({
            where: { studentId },
            include: [{
                model: Classroom,
                as: 'classroom',
                where: { status: CLASSROOM_STATUS.ACTIVE },
                required: true
            }]
        });

        if (!classroomStudent) {
            const result = {
                studentName: existingStudent.name,
                standardsCount: 0,
                classroomName: '',
                standardsData: [],
                videosData: [],
                averageObtainedWeightage: 0,
                averageTotalWeightage: 0,
                assignmentsSolved: 0,
                assignmentsLeft: 0,
                assignmentsMissed: 0,
            };

            return { code: 200, data: result };
        }

        // Then, when you need the classroom courses, you can load them
        const classroomCourses = await ClassroomCourses.findAll({
            where: { classroomId: classroomStudent?.classroom.id },
            include: [{
                model: Standard,
                as: 'standard'
            }]
        });

        // Count of standards
        const standardsCount = classroomCourses?.length;

        // Classroom name
        const classroomName = classroomStudent?.classroom.name;

        // For each standard, get its name and count of video and non-video resources
        const standardsData = await Promise.all(classroomCourses?.slice(0, Math.min(3, classroomCourses.length)).map(async (course) => {
            const dailyUploads = await DailyUpload.findAll({
                where: { standardId: course.standard.id },
                include: [{
                    model: Resource,
                    as: 'resource'
                }]
            });

            const videoResourcesCount = dailyUploads?.filter(upload => upload.resource.type === 'video')?.length || 0;
            const nonVideoResourcesCount = dailyUploads?.length - videoResourcesCount;

            return {
                standardId: course.standard.id,
                standardName: course.standard.name,
                videoResourcesCount,
                nonVideoResourcesCount
            };
        }));

        const data = await ClassroomStudent.findOne({
            where: {
                studentId: studentId
            },
            attributes: ["id"],
            include: [
                {
                    model: Classroom,
                    as: 'classroom',
                    where: { status: CLASSROOM_STATUS.ACTIVE },
                    attributes: ["id", "name"],
                    include: [{
                        model: ClassroomCourses,
                        as: 'classroomCourses',
                        attributes: ["id", "startDate"],
                        include: [{
                            model: Standard,
                            as: 'standard',
                            attributes: ["id", "name"],
                            include: [{
                                model: DailyUpload,
                                as: 'dailyUploads',
                                attributes: ['id', 'accessibleDay', 'weightage'],
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
                                            attributes: ['id', 'totalMarks', 'deadline'],
                                        }
                                    ]
                                }]
                            }]
                        }],
                    }],
                }
            ],
        });

        const plainData = await data?.get({ plain: true });

        if (!plainData || !plainData.classroom) {
            const result = {
                studentName: existingStudent.name,
                standardsCount: 0,
                classroomName: '',
                standardsData: [],
                averageObtainedWeightage: 0,
                averageTotalWeightage: 0,
                assignmentsSolved: 0,
                assignmentsLeft: 0,
                assignmentsMissed: 0,
            };
            return {
                code: 200,
                data: result
            };
        }
        if (!plainData.classroom.classroomCourses || plainData.classroom.classroomCourses.length <= 0) {
            const result = {
                studentName: existingStudent.name,
                standardsCount: 0,
                classroomName: plainData.classroom.name,
                standardsData: [],
                averageObtainedWeightage: 0,
                averageTotalWeightage: 0,
                assignmentsSolved: 0,
                assignmentsLeft: 0,
                assignmentsMissed: 0,
            };
            return {
                code: 200,
                data: result
            };
        }

        const transformedData = data?.classroom?.classroomCourses?.map(course => {
            const standard = course?.standard;
            let totalWeightage = 0;

            standard?.dailyUploads?.forEach(upload => {
                // Only consider uploads with startDay + accessibleDay < today
                if (isReleased(course.startDate, upload.accessibleDay)) {
                    totalWeightage += upload.weightage;
                }
            })
            return {
                standardId: standard.id,
                standardName: standard.name,
                totalWeightage: parseFloat(totalWeightage.toFixed(1))
            };
        })

        // Calculate average total weightage
        const totalTotalWeightage = transformedData?.reduce((total, entry) => {
            return total + entry.totalWeightage;
        }, 0);
        const averageTotalWeightage = transformedData?.length > 0 ? totalTotalWeightage / transformedData.length : 0;

        const studentClassroomResult = await sequelize.query(`
            SELECT
                c.id AS classroom_id,
                c.name AS classroom_name,
                u.id AS student_id,
                u.name AS student_name,
                u.email AS student_email,
                u.image AS student_image,
                COUNT(e.id) AS standard_count,
                SUM(e.result) AS total_performance,
                CASE 
                    WHEN COUNT(e.id) > 0 THEN ROUND(SUM(e.result)::numeric / COUNT(e.id), 2)
                    ELSE 0 
                END AS class_result
            FROM
                public."Classrooms" AS c
            INNER JOIN
                public."ClassroomCourses" AS cc
                ON c.id = cc."classroomId"
            INNER JOIN
                public."Standards" AS s
                ON cc."standardId" = s.id
            INNER JOIN
                public."Enrollments" AS e
                ON c.id = e."classroomId" AND s.id = e."standardId"
            INNER JOIN
                public."Users" AS u
                ON e."studentId" = u.id
            WHERE
                e."studentId" = '${studentId}' AND c."status" = 'active'
            GROUP BY
                c.id, c.name, u.id, u.name, u.email, u.image
        `,);
        // Calculate average obtained weightage
        const averageObtainedWeightage = studentClassroomResult[0][0].class_result;

        const rawAttemptedAssessmentsResults = await sequelize.query(`
            SELECT
                c.id AS classroom_Id,
                cc."standardId" AS standard_id,
                cc."startDate" AS start_date,
                du."accessibleDay" AS accessible_day,
                ard."resourceId" AS assessment_resource_id,
                ard.id AS assessment_resource_detail_id,
                ard."deadline" AS deadline,
                aa.id AS assessment_answer_id
            FROM
                public."Classrooms" c
            INNER JOIN
                public."ClassroomStudents" cs
                ON c.id = cs."classroomId"
            INNER JOIN
                public."ClassroomCourses" cc
                ON c.id = cc."classroomId"
            INNER JOIN
                public."DailyUploads" du
                ON du."standardId" = cc."standardId"
            INNER JOIN
                public."AssessmentResourcesDetails" ard
                ON ard."resourceId" = du."resourceId"
            LEFT JOIN
                public."AssessmentAnswers" aa
                ON ard.id = aa."assessmentResourcesDetailId"
                AND aa."userId" = '${studentId}'
                AND aa."classroomId" = c.id
                AND aa."standardId" = cc."standardId"
            WHERE
                c."status" = 'active'
        `);

        const attemptedAssessmentsResults = rawAttemptedAssessmentsResults[0];

        let assignmentsSolved = 0;
        let assignmentsLeft = 0;
        let assignmentsMissed = 0;

        attemptedAssessmentsResults.forEach(attemptedAssessment => {
            if (attemptedAssessment.assessment_answer_id) {
                assignmentsSolved++;
            } else if (!attemptedAssessment.assessment_answer_id && canSubmitAssessment(attemptedAssessment.start_date, attemptedAssessment.accessible_day, attemptedAssessment.deadline)) {
                assignmentsLeft++;
            } else {
                assignmentsMissed++;
            }
        });

        const result = {
            studentName: existingStudent.name,
            standardsCount,
            classroomName,
            standardsData,
            averageObtainedWeightage,
            averageTotalWeightage,
            assignmentsSolved,
            assignmentsLeft,
            assignmentsMissed
        };

        return { code: 200, data: result };

    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting total classrooms and courses of student for student dahsboard');
        return { code: 500 };
    }
}

module.exports = {
    getTeacherDashboardSummaries,
    getAdminDashboardSummaries,
    getStudentDashboardSummaries
};
