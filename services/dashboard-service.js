const { Sequelize, Op } = require("sequelize");
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

        const videos = await Resource.findAll({
            where: { type: RESOURCE_TYPES.VIDEO },
        });

        const resources = await Resource.findAll({
            where: { type: { [Op.not]: RESOURCE_TYPES.VIDEO } },
        });

        const result = {
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

        // When you need the daily uploads, you can load them
        const dailyUploads = await DailyUpload.findAll({
            where: { standardId: { [Op.in]: classroomCourses.map(course => course.standard.id) } },
            include: [{
                model: Resource,
                as: 'resource'
            }]
        });

        // When you need the video, you can load it
        const videos = await Video.findAll({
            where: { resourceId: { [Op.in]: dailyUploads.map(upload => upload.resource.id) } },
            include: [
                {
                    model: VideoTracking,
                    as: 'videoTrackings',
                    separate: true,
                    where: {saved: true}
                },
                {
                    model: Question,
                    as: 'questions',
                    separate: true,
                    attributes: ['id']
                }
            ]
        });

        

        return { code: 200, data: videos };

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
