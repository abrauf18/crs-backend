const { Sequelize } = require("sequelize");
const { logger } = require("../Logs/logger.js");
const { Classroom, Standard, ClassroomCourses, ClassroomStudent, User, DailyUpload, Resource, Video, VideoTracking, Question,VideoQuestionAnswer } = require("../models/index.js");
const { CLASSROOM_STATUS } = require("../utils/enumTypes.js");

function timeToSeconds(time) {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}

function compareTimes(time1, time2) {
    const time1Seconds = timeToSeconds(time1);
    const time2Seconds = timeToSeconds(time2);

    if (time1Seconds > time2Seconds) {
        return 1; // time1 is greater than time2
    } else if (time1Seconds < time2Seconds) {
        return -1; // time1 is less than time2
    } else {
        return 0; // time1 is equal to time2
    }
}

const getStudentCurrentStandards = async ({ studentId }) => {
    try {
        const student = await User.findByPk(studentId);
        if (!student) {
            return { code: 404, message: 'Student not found'};
        }

        const currentClassroom = await Classroom.findOne({
            include: [
                {
                    model: ClassroomStudent,
                    as: 'classroomStudents',
                    where: {
                        studentId: studentId,
                    },
                }, 
                {
                    model: ClassroomCourses,
                    as: 'classroomCourses',
                    include: [{
                        model: Standard,
                        as: 'standard',
                        include: [{ 
                            model: DailyUpload, 
                            as: 'dailyUploads',
                            attributes: ['id'],
                            include: [{
                                model: Resource,
                                as: 'resource',
                                attributes: ['type'],
                            }]
                        }]
                    }],
                }
            ],
            where: {
                status: CLASSROOM_STATUS.ACTIVE
            }
        });

        const summarizedStandards = currentClassroom?.classroomCourses?.map(course => {
            const totalVideoUploads = course.standard.dailyUploads.reduce((count, upload) => {
                return count + (upload.resource.type === 'video' ? 1 : 0);
            }, 0);
        
            return {
                id: course.standard.id,
                courseLength: course.standard.courseLength,
                name: course.standard.name,
                standardDescription: course.standard.description,
                totalVideoUploads: totalVideoUploads,
                totalNonVideoUploads: course.standard.dailyUploads.length - totalVideoUploads
            };
        });

        return { code: 200, data: summarizedStandards };
    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while fetching standards summaries');
        return { code: 500 };
    }
};

const getStandardResources = async ({ standardId }) => {
    try {
        const standard = await Standard.findByPk(standardId, {
            include: [{
                model: DailyUpload,
                as: 'dailyUploads',
                attributes: ['accessDate'],
                include: [{
                    model: Resource,
                    as: 'resource',
                    attributes: ['id', 'name', 'type', 'topic'],
                    include: [{
                        model: Video,
                        as: 'video',
                        attributes: ['id']
                    }]
                }]
            }]
        });

        if (!standard) {
            return { code: 404, message: 'Standard not found' };
        }

        // Transform the data
        const uploadsByDate = standard.dailyUploads.reduce((result, upload) => {
            const date = upload.accessDate;
            if (!result[date]) {
                result[date] = [];
            }
            if (upload.resource) {
                result[date].push(upload.resource);
            }
            return result;
        }, {});

        const transformedDailyUploads = Object.keys(uploadsByDate).sort().map(date => ({
            date: date,
            released: date <= new Date().toISOString(),
            topics: uploadsByDate[date].map(resource => ({
                resourceId: resource.id,
                name: resource.name,
                type: resource.type,
                topic: resource.topic,
                videoId: resource.video ? resource.video.id : null
            }))
        }));

        const result = {
            name: standard.name,
            description: standard.description,
            dailyUploads: transformedDailyUploads
        };

        return { code: 200, data: result };
    } catch (error) {
        console.log('\n\n\n\n', error)
        logger.error(error?.message || 'An error occurred while fetching the standard');
        return { code: 500 };
    }
};

const getStudentVideo = async ({ videoId, studentId }) => {
    try {
        const student = await User.findByPk(studentId);
        if (!student) {
            return { code: 404, message: 'Student not found'};
        }

        const watchedVideo = await VideoTracking.findOne({
            where: {
                videoId: videoId,
                studentId: studentId
            }
        });

        if (watchedVideo) {
            const video = await Video.findOne({
                where: { id: videoId },
                include: [{
                    model: Resource,
                    as: 'resource',
                    attributes: ['name', 'url'],
                }, {
                    model: Question,
                    as: 'questions',
                    order: [['popUpTime', 'ASC']],
                    include: [{
                        model: VideoQuestionAnswer,
                        as: 'answers',
                        where: { userId: studentId },
                    }]
                }],
                group: ['Video.id', 'resource.id', 'questions.id', 'questions.answers.id'],
            });

            if (!video) {
                return { code: 404, message: 'Video not found'};
            }

            const transformedQuestions = video.questions.map(question => {
                const { answers, createdAt, updatedAt, videoId, ...questionData } = question.get({ plain: true });
                const transformedAnswers = answers.map(answer => {
                    const { createdAt, updatedAt, userId, questionId, ...answerData } = answer;
                    return answerData;
                });
                return {
                    ...questionData,
                    answer: transformedAnswers
                };
            });

            const { resource, questions, topics, createdAt, updatedAt, ...videoData } = video.get({ plain: true });

            return {
                code: 200,
                data: {
                    video: { ...videoData, name: resource.name, videoUrl: resource.url, questions: transformedQuestions, topics }
                }
            };
            
        } else {
            const video = await Video.findOne({
                where: { id: videoId },
                include: [{
                    model: Resource,
                    as: 'resource',
                    attributes: ['name', 'url'],
                }, {
                    model: Question,
                    as: 'questions',
                    order: [['popUpTime', 'ASC']],
                }],
                group: ['Video.id', 'resource.id', 'questions.id'],
            });
    
            if (!video) {
                return { code: 404, message: 'Video not found'};
            }
    
            const { resource, questions, topics, ...videoData } = video.get({ plain: true });

            return {
                code: 200,
                data: {
                    video: { ...videoData, name: resource.name, videoUrl: resource.url, questions, topics }
                }
            };
        }
    } catch (error) {
        console.log('\n\n\n\n', error)
        logger.error(error?.message || 'An error occurred while fetching the video');
        return { code: 500 };
    }
}

const storeStudentVideo = async ({ videoId, studentId, last_seen_time }) => {
    try {
        const video = await Video.findByPk(videoId);
        if (!video) {
            return { code: 404, message: 'Video not found'};
        }

        const student = await User.findByPk(studentId);
        if (!student) {
            return { code: 404, message: 'Student not found'};
        }

        if (compareTimes(last_seen_time, video.duration) > 0) {
            return { code: 400 };
        }

        const videotracking = await VideoTracking.create({
            videoId: videoId,
            studentId: studentId,
            last_seen_time: last_seen_time,
        });

        return { code: 200, data: videotracking};
    } catch (error) {
        console.log('\n\n\n\n', error)
        logger.error(error?.message || 'An error occurred while storing the video');
        return { code: 500 };
    }
}

module.exports = {
    getStudentCurrentStandards,
    getStandardResources,
    getStudentVideo,
    storeStudentVideo,
};
