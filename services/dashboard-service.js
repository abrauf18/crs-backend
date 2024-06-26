const { Sequelize, Op, fn, col, literal } = require("sequelize");
const { logger } = require("../Logs/logger.js");
// @ts-ignore
const { Classroom, Standard, ClassroomCourses, ClassroomStudent, User, Resource, DailyUpload, Video, VideoTracking, Question } = require("../models/index.js");
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

        // Then, when you need the classroom courses, you can load them
        const classroomCourses = await ClassroomCourses.findAll({
            where: { classroomId: classroomStudent.classroom.id },
            include: [{
                model: Standard,
                as: 'standard'
            }]
        });

        // Count of standards
        const standardsCount = classroomCourses?.length;

        // Classroom name
        const classroomName = classroomStudent.classroom.name;

        // For each standard, get its name and count of video and non-video resources
        const standardsData = await Promise.all(classroomCourses.slice(0, Math.min(3, classroomCourses.length)).map(async (course) => {
            const dailyUploads = await DailyUpload.findAll({
                where: { standardId: course.standard.id },
                include: [{
                    model: Resource,
                    as: 'resource'
                }]
            });

            const videoResourcesCount = dailyUploads.filter(upload => upload.resource.type === 'video')?.length;
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
            where: { standardId: classroomCourses.map(course => course.standard.id) },
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
        // Final result
        const result = {
            studentName: existingStudent.name,
            standardsCount,
            classroomName,
            standardsData,
            videosData
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
