const { Sequelize, Op, fn, col, literal } = require("sequelize");
const { logger } = require("../Logs/logger.js");
// @ts-ignore
const { sequelize, Classroom, Standard, ClassroomCourses, ClassroomStudent, User, DailyUpload, Resource, Video, VideoTracking, Question, VideoQuestionAnswer, AssessmentResourcesDetail, AssessmentAnswer, DailyProgress } = require("../models/index.js");
const { RESOURCE_TYPES, CLASSROOM_STATUS } = require("../utils/enumTypes.js");

const getTeacherDashboardSummaries = async ({ teacherId }) => {
    try {
        const classrooms = await Classroom.findAll({
            where: { teacherId },
            include: [{
                model: ClassroomStudent,
                as: 'classroomStudents'
            }]
        });

        const totalClassrooms = classrooms.length;
        const totalStudents = classrooms?.reduce((total, classroom) => total + classroom.classroomStudents.length, 0);

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
      
        const data = await Classroom.findAll({
            where: { status: CLASSROOM_STATUS.ACTIVE, teacherId: teacherId },
            attributes: ["id", "name"],
            include: [
                {
                    model: ClassroomCourses,
                    as: 'classroomCourses',
                    attributes: ["id"],
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
                    }],
                },
                {
                    model: ClassroomStudent,
                    as: 'classroomStudents',
                    attributes: ['id', 'classroomId', 'studentId'],
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
            ],
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const transformedData = data?.map(classItem => {
            const standardsMap = new Map();
            const currentDate = new Date();
        
            classItem.classroomCourses?.forEach(course => {
                const standard = course.standard;
                if (standard) {
                    if (!standardsMap.has(standard.id)) {
                        standardsMap.set(standard.id, {
                            standardId: standard.id,
                            standardName: standard.name,
                            currentTotalWeightage: 0,
                            usersWeightage: [],
                        });
                    }
        
                    const standardEntry = standardsMap.get(standard.id);
        
                    if (standard.dailyUploads && standard.dailyUploads.length > 0) {
                        standardEntry.currentTotalWeightage += standard.dailyUploads
                            .filter(upload => new Date(upload.accessDate) < currentDate)
                            .reduce((acc, upload) => acc + upload.weightage, 0);
                    }
                }
            });
        
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
                                obtainedWeightage: 0
                            };
                            standardEntry.usersWeightage.push(userEntry);
                        }
        
                        student.student.VideoQuestionAnswers?.forEach(answer => {
                            const videoQuestion = answer.question;
                            if (videoQuestion.video && videoQuestion.video.resource.DailyUpload) {
                                const dailyUpload = videoQuestion.video.resource.DailyUpload;
                                if (new Date(dailyUpload.accessDate) < currentDate) {
                                    const obtainedWeightage = (answer.obtainedMarks / videoQuestion.totalMarks) * dailyUpload.weightage;
                                    userEntry.obtainedWeightage += obtainedWeightage;
                                }
                            }
                        });
        
                        student.student.AssessmentAnswers?.forEach(answer => {
                            const assessmentResource = answer.assessmentResourcesDetail;
                            if (assessmentResource.resource.DailyUpload) {
                                const dailyUpload = assessmentResource.resource.DailyUpload;
                                if (new Date(dailyUpload.accessDate) < currentDate) {
                                    const obtainedWeightage = (answer.obtainedMarks / assessmentResource.totalMarks) * dailyUpload.weightage;
                                    userEntry.obtainedWeightage += obtainedWeightage;
                                }
                            }
                        });
                    }
                });
            });
        
            // Calculate the average obtained weightage for each standard and student distribution
            standardsMap?.forEach(standardEntry => {
                const totalObtainedWeightage = standardEntry.usersWeightage.reduce((acc, user) => acc + user.obtainedWeightage, 0);
                standardEntry.averageObtainedWeightage = totalObtainedWeightage / (standardEntry.usersWeightage.length || 1);
            });
        
            // Calculate the total obtained score and total weightage for each student
            const studentsData = classItem.classroomStudents?.map(student => {
                const totalObtainedScore = Array.from(standardsMap.values()).reduce((acc, standardEntry) => {
                    const userEntry = standardEntry.usersWeightage.find(u => u.userId === student.student.id);
                    return acc + (userEntry ? userEntry.obtainedWeightage : 0);
                }, 0);
                const totalWeightage = Array.from(standardsMap.values()).reduce((acc, standardEntry) => {
                    return acc + standardEntry.currentTotalWeightage;
                }, 0);
                return {
                    userId: student.student.id,
                    userName: student.student.name,
                    userEmail: student.student.email,
                    image: student.student.image,
                    obtainedWeightage: totalObtainedScore / standardsMap.size || 0,
                    totalWeightage: totalWeightage / standardsMap.size || 0,
                    classId: classItem.id,
                    className: classItem.name,
                };
            }).filter(student => student !== undefined);
        
            // Calculate average overall obtained weightage and total weightage for the class
            const overallObtainedWeightage = studentsData.reduce((acc, student) => acc + student.obtainedWeightage, 0) / (studentsData.length || 1);
            const overallTotalWeightage = studentsData.reduce((acc, student) => acc + student.totalWeightage, 0) / (studentsData.length || 1);
        
            // Calculate average obtained weightage and total weightage for each standard
            const standardsData = Array.from(standardsMap.values()).map(standardEntry => ({
                standardId: standardEntry.standardId,
                standardName: standardEntry.standardName,
                avgObtainedWeightage: standardEntry.averageObtainedWeightage || 0, // Default to 0 if undefined
                totalWeightage: standardEntry.currentTotalWeightage
            }));
        
            return {
                classId: classItem.id,
                className: classItem.name,
                standardList: standardsData,
                studentsData: studentsData.filter(student => student !== undefined),
                overallObtainedWeightage,
                overallTotalWeightage
            };
        }).filter(classItem => classItem !== undefined && classItem.classId);
        // Calculate average total weightage across all classes
        const avgTotalWeightage = transformedData.reduce((acc, classItem) => acc + classItem.overallTotalWeightage, 0) / (transformedData.length || 1);
        // Calculate average obtained weightage across all classes
        const avgObtainedWeightage = transformedData.reduce((acc, classItem) => acc + classItem.overallObtainedWeightage, 0) / (transformedData.length || 1);

        // const summarizedStandards = await ClassroomCourses.findAll({
        //     attributes: ['id'],
        //     include: [{
        //         model: Classroom,
        //         as: 'classroom',
        //         where: { 
        //             teacherId: teacherId,
        //             status: CLASSROOM_STATUS.ACTIVE 
        //         },
        //         attributes: ['name']
        //     },
        //     {
        //         model: Standard,
        //         as: 'standard',
        //         attributes: ['id', 'name']
        //     }],
        // })

        // const transformedSummarizedStandards = summarizedStandards?.map(traversingStandard => {
        //     const { id, classroom, standard } = traversingStandard.toJSON();
        //     return { id, className: classroom.name, standardName: standard.name, standardId: standard.id }
        // });
        
        return { 
            code: 200, 
            data: { 
                totalClassrooms, 
                totalStudents, 
                usersJoining: cumulativeResults,
                avgTotalWeightage,
                avgObtainedWeightage,
                students: transformedData.flatMap(classItem => classItem.studentsData).filter(student => student !== undefined),
                // standardAndCourses: transformedSummarizedStandards
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

const getStudentDashboardSummaries = async ({ studentId }) => {
    try {
        // const classrooms = await ClassroomStudent.findOne({
        //     where: { studentId },
        //     include: [{
        //         model: Classroom,
        //         as: 'classroom',
        //         where: { status : CLASSROOM_STATUS.ACTIVE },
        //         attributes: ['name'],
        //         required: true,
        //         include: [{
        //             model: ClassroomCourses,
        //             as: 'classroomCourses',
        //             attributes: ['id'],
        //             include: [{
        //                 model: Standard,
        //                 as: 'standard',
        //                 attributes: ['id', 'name', 'courseLength'],
        //                 include: [{
        //                     model: DailyUpload,
        //                     as: 'dailyUploads',
        //                     separate: true,
        //                     attributes: ['id', 'resourceId'],
        //                     include: [{
        //                         model: Resource,
        //                         as: 'resource',
        //                         attributes: ['id', 'type'],
        //                         include: [{
        //                             model: Video,
        //                             as: 'video',
        //                             attributes: ['id','thumbnailURL', 'topics', 'duration', 'resourceId'],
        //                             include: [
        //                                 {
        //                                     model: VideoTracking,
        //                                     as: 'videoTrackings',
        //                                     separate: true,
        //                                     where: {saved: true},
        //                                     attributes: ['last_seen_time', 'videoId']
        //                                 },
        //                                 {
        //                                     model: Question,
        //                                     as: 'questions',
        //                                     separate: true,
        //                                     attributes: ['id']
        //                                 }
        //                             ]
        //                         }]
        //                     }]
        //                 }]
        //             }]
        //         }]
        //     }]
        // });

        const existingStudent = await User.findByPk(studentId)
        if (!existingStudent){
            return { code: 404, message: 'Student not found' };
        }

        // First, find the classroom student
        const classroomStudent = await ClassroomStudent.findOne({
            where: { studentId },
            include: [{
                model: Classroom,
                as: 'classroom',
                where: { status : CLASSROOM_STATUS.ACTIVE },
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

        // Fetch all daily uploads for the classroom student
        const allDailyVideoUploads = await DailyUpload.findAll({
            where: { standardId: classroomCourses?.map(course => course.standard.id) },
            include: [{
                model: Resource,
                as: 'resource',
                include: [{
                    model: Video,
                    as: 'video',
                    include: [
                        {
                            model: VideoTracking,
                            as: 'videoTrackings',
                            where: { saved: true },
                            required: true
                        },
                        {
                            model: Question,
                            as: 'questions',
                            required: false
                        }
                    ],
                    required: true
                }],
                required: true
            }],
            order: [['createdAt', 'DESC']],
            limit: 6
        });

        // For each video, get the required data
        const videosData = allDailyVideoUploads?.map(upload => ({
            standardId: upload?.standardId,
            videoId: upload.resource?.video?.id,
            videoName: upload.resource?.name,
            questionsCount: upload.resource?.video?.questions?.length,
            topicsCount: Object.keys(upload.resource?.video?.topics).length,
            lastSeenTime: upload.resource?.video?.videoTrackings?.length > 0 ? upload.resource?.video?.videoTrackings[0]?.last_seen_time : null,
            duration: upload.resource?.video?.duration,
            thumbnailURL: upload.resource?.video?.thumbnailURL,
            completed: upload.resource.video.videoTrackings[0].watchedCompletely,
        }));

        const data = await ClassroomStudent.findOne({
            where: {
                studentId: studentId
            },
            attributes: [ "id" ],
            include: [ 
                {
                    model: DailyProgress,
                    attributes: ["id", "classroomStudentId", "obtainedWeightage", "totalWeightage", "date"],
                    required: false
                },
                {
                    model: Classroom,
                    as: 'classroom',
                    where: { status: CLASSROOM_STATUS.ACTIVE },
                    attributes: [ "id", "name" ],
                    include: [{
                        model: ClassroomCourses,
                        as: 'classroomCourses',
                        attributes: [ "id" ],
                        include: [{
                            model: Standard,
                            as: 'standard',
                            attributes: [ "id", "name" ],
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
                                                include: [{
                                                    separate: true,
                                                    model: VideoQuestionAnswer,
                                                    as: 'answers',
                                                    where: { userId: studentId },
                                                    required: false,
                                                    attributes: ['obtainedMarks']
                                                }]
                                            }]
                                        },
                                        {
                                            model: AssessmentResourcesDetail,
                                            as: 'AssessmentResourcesDetail',
                                            attributes: ['id', 'totalMarks', 'deadline'],
                                            include: [{
                                                separate: true,
                                                model: AssessmentAnswer,
                                                as: 'assessmentAnswers',
                                                where: { userId: studentId },
                                                attributes: ['obtainedMarks', 'answerURL'],
                                                required: false,
                                            }]
                                        }
                                    ]
                                }]
                            }]
                        }],
                    }],
                }
            ],
        });

        // Current date for comparison
        const today = new Date();

        const plainData = await data?.get({plain: true});

        if (!plainData || !plainData.classroom) {
            const result = {
                studentName: existingStudent.name,
                standardsCount: 0,
                classroomName: '',
                standardsData: [],
                videosData: [],
                averageObtainedWeightage: 0,
                averageTotalWeightage: 0,
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
                videosData: [],
                averageObtainedWeightage: 0,
                averageTotalWeightage: 0,
            };
            return {
                code: 200,
                data: result
            };
        }

        const transformedData = data?.classroom?.classroomCourses?.map(course => {
            const standard = course?.standard;
            let totalWeightage = 0;
            let obtainedWeightage = 0;
    
            standard?.dailyUploads?.forEach(upload => {
                let totalObtainedMarks = 0;
                let totalPossibleMarks = 0;
                const accessDate = new Date(upload.accessDate);
    
                // Only consider uploads with accessDate < today
                if (accessDate < today) {
                    totalWeightage += upload.weightage;
    
                    // Process resource's video questions
                    if (upload.resource.video) {
                        totalPossibleMarks = upload.resource.video?.questions?.reduce((total, question) => {
                            return total + question.totalMarks;
                        }, 0);
                        upload.resource.video.questions.forEach(question => {
                            question?.answers?.forEach(answer => {
                                totalObtainedMarks += answer.obtainedMarks === -1 ? 0 : answer.obtainedMarks;
                            });
                        });
                    }
    
                    // Process resource's assessment answers
                    if (upload.resource.AssessmentResourcesDetail) {
                        upload.resource.AssessmentResourcesDetail.assessmentAnswers.forEach(answer => {
                            totalObtainedMarks += answer?.obtainedMarks === -1 ? 0 : answer?.obtainedMarks;
                        });
                        totalPossibleMarks += upload.resource.AssessmentResourcesDetail?.totalMarks || 0;
                    }
                    obtainedWeightage += totalPossibleMarks > 0 ? (totalObtainedMarks / totalPossibleMarks) * upload.weightage : upload.weightage;
                }
            })
            return {
                standardId: standard.id,
                standardName: standard.name,
                totalWeightage: parseFloat(totalWeightage.toFixed(1)),
                obtainedWeightage: parseFloat(obtainedWeightage.toFixed(1))
            };
        })

        // Calculate average total weightage
        const totalTotalWeightage = transformedData?.reduce((total, entry) => {
            return total + entry.totalWeightage;
        }, 0);
        const averageTotalWeightage = transformedData?.length > 0 ? totalTotalWeightage / transformedData.length : 0;
        
        // Calculate average obtained weightage
        const totalObtainedWeightage = transformedData?.reduce((total, entry) => {
            return total + entry.obtainedWeightage;
        }, 0);
        const averageObtainedWeightage = transformedData?.length > 0 ? totalObtainedWeightage / transformedData.length : 0;

        const result = {
            studentName: existingStudent.name,
            standardsCount,
            classroomName,
            standardsData,
            videosData,
            averageObtainedWeightage,
            averageTotalWeightage
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
