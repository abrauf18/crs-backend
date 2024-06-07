const { Sequelize, where } = require("sequelize");
const { logger } = require("../Logs/logger.js");
// @ts-ignore
const { Classroom, Standard, ClassroomCourses, ClassroomStudent, User, DailyUpload, Resource, Video, VideoTracking, Question, VideoQuestionAnswer, AssessmentResourcesDetail, AssessmentAnswer } = require("../models/index.js");
const { CLASSROOM_STATUS } = require("../utils/enumTypes.js");
const standard = require("../models/standard.js");

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

function canSubmitAssessment(uploadDate, daysToAdd) {
    const uploadDateObj = new Date(uploadDate);
    uploadDateObj.setDate(uploadDateObj.getDate() + daysToAdd + 1);
    const today = new Date();
    if (today > uploadDateObj) {
        return false;
    }
    return true;
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
                        required: false
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
                    attempt: transformedAnswers[0]
                };
            });

            const { resource, questions, topics, createdAt, updatedAt, ...videoData } = video.get({ plain: true });

            return {
                code: 200,
                data: {
                    video: { ...videoData, lastSeenTime: watchedVideo.last_seen_time, name: resource.name, videoUrl: resource.url, questions: transformedQuestions, topics }
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

        const existingVideoTracking = await VideoTracking.findOne({
            where: {
                videoId: videoId,
                studentId: studentId
            }
        });

        if (existingVideoTracking) {
            await existingVideoTracking.update({
                last_seen_time: last_seen_time
            });

            return { code: 200, data: existingVideoTracking };
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

const getStudentStandard = async ({ standardId, studentId }) => {
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
                    include: [
                        {
                            model: Video,
                            as: 'video',
                            attributes: ['id'],
                            include: [{
                                model: VideoTracking,
                                as: 'videoTrackings',
                                required: false,
                                attributes: ['id', 'watchedCompletely'],
                                where: { studentId: studentId }
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
        });

        if (!standard) {
            return { code: 404, message: 'Standard not found' };
        }

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
                videoId: resource.video ? resource.video.id : null,
                watched: resource.video?.videoTrackings.length > 0,
                completed: resource.video?.videoTrackings[0]?.watchedCompletely || false,
                canWrite: resource?.AssessmentResourcesDetail ? canSubmitAssessment(date, resource.AssessmentResourcesDetail.deadline) : false
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

const UpdateStudentVideoCompleted = async ({ videoId, studentId, watchedCompletely, last_seen_time }) => {
    try {
        const video = await Video.findByPk(videoId);
        if (!video) {
            return { code: 404, message: 'Video not found'};
        }

        const student = await User.findByPk(studentId);
        if (!student) {
            return { code: 404, message: 'Student not found'};
        }

        const videoTracking = await VideoTracking.findOne({
            where: {
                videoId: videoId,
                studentId: studentId
            }
        });

        if (compareTimes(last_seen_time, video.duration) > 0) {
            return { code: 400 };
        }

        if (!videoTracking) {
            const newVideotracking = await VideoTracking.create({
                videoId: videoId,
                studentId: studentId,
                last_seen_time: last_seen_time,
                watchedCompletely: watchedCompletely,
            });
    
            return { code: 200, data: newVideotracking};
        }

        const updatedVideoTracking = await videoTracking.update({
            watchedCompletely: watchedCompletely,
            last_seen_time: last_seen_time
        });

        return { code: 200, data: updatedVideoTracking };
    } catch (error) {
        console.log('\n\n\n\n', error)
        logger.error(error?.message || 'An error occurred while updating the video tracking');
        return { code: 500 };
    }
}

const UpdateStudentVideoLastSeenTime = async ({ videoId, studentId, last_seen_time }) => {
    try {
        const video = await Video.findByPk(videoId);
        if (!video) {
            return { code: 404, message: 'Video not found'};
        }

        const student = await User.findByPk(studentId);
        if (!student) {
            return { code: 404, message: 'Student not found'};
        }

        const videoTracking = await VideoTracking.findOne({
            where: {
                videoId: videoId,
                studentId: studentId
            }
        });

        if (compareTimes(last_seen_time, video.duration) > 0) {
            return { code: 400 };
        }

        if (!videoTracking) {
            const newVideotracking = await VideoTracking.create({
                videoId: videoId,
                studentId: studentId,
                last_seen_time: last_seen_time,
            });
    
            return { code: 200, data: newVideotracking};
        }

        const updatedVideoTracking = await videoTracking.update({
            last_seen_time: last_seen_time
        });

        return { code: 200, data: updatedVideoTracking };
    } catch (error) {
        console.log('\n\n\n\n', error)
        logger.error(error?.message || 'An error occurred while updating the video tracking');
        return { code: 500 };
    }
}

const SaveOrRemoveVideo = async ({ videoId, studentId, save }) => {
    try {
        console.log(`\n\n\n videoId: ${videoId}, studentId: ${studentId}`);

        const video = await Video.findByPk(videoId);
        if (!video) {
            return { code: 404, message: 'Video not found'};
        }

        const student = await User.findByPk(studentId);
        if (!student) {
            return { code: 404, message: 'Student not found'};
        }

        const existingVideoTracking = await VideoTracking.findOne({
            where: {
                videoId: videoId,
                studentId: studentId
            }
        });

        if (existingVideoTracking) {
            await existingVideoTracking.update({
                saved: save
            });

            return { code: 200, data: existingVideoTracking };
        }

        const videotracking = await VideoTracking.create({
            videoId: videoId,
            studentId: studentId,
            saved: save,
        });

        return { code: 200, data: videotracking};
    } catch (error) {
        console.log('\n\n\n\n', error)
        logger.error(error?.message || 'An error occurred while storing the video');
        return { code: 500 };
    }
}

const getSavedVideos = async ({ studentId }) => {
    try {
        const student = await User.findByPk(studentId);
        if (!student) {
            return { code: 404, message: 'Student not found'};
        }

        const savedVideos = await VideoTracking.findAll({
            where: {
                studentId: studentId,
                saved: true
            },
            attributes: ['videoId', 'last_seen_time', 'watchedCompletely'],
            include: [{
                model: Video,
                as: 'video',
                attributes: ['id', 'thumbnailURL', 'duration', 'topics'],
                include: [
                    {
                        model: Resource,
                        as: 'resource',
                        attributes: ['id', 'name'],
                        include: [{
                            model: DailyUpload,
                            as: 'DailyUpload',
                            attributes: ['accessDate', 'standardId'],
                        }]
                    },
                    {
                        model: Question,
                        as: 'questions',
                        attributes: ['id'],
                    }
                ]
            }]
        });

        const transformedVideos = savedVideos.map(savedVideo => {
            const { videoId, last_seen_time, watchedCompletely, video } = savedVideo.get({ plain: true });
            const { resource, ...videoData } = video
            return {
                videoId: videoId,
                name: resource.name,
                lastSeenTime: last_seen_time,
                thumbnailURL: videoData.thumbnailURL,
                duration: videoData.duration,
                topicCount: Object.keys(videoData.topics).length,
                questionCount: videoData.questions.length,
                accessDate: resource.DailyUpload.accessDate,
                completed: watchedCompletely,
                standardId: resource.DailyUpload.standardId
            };
        });

        const groupedVideos = transformedVideos.reduce((grouped, video) => {
            const date = video.accessDate;
            const index = grouped.findIndex(group => group.date === date);
            if (index === -1) {
                grouped.push({ date, videos: [video] });
            } else {
                grouped[index].videos.push(video);
            }
            return grouped;
        }, []);
        
        const sortedGroupedVideos = groupedVideos.sort((a, b) => a.date < b.date ? -1 : (a.date > b.date ? 1 : 0));

        return { code: 200, data: sortedGroupedVideos };
    } catch (error) {
        console.log('\n\n\n\n', error)
        logger.error(error?.message || 'An error occurred while fetching the saved videos');
        return { code: 500 };
    }
}

module.exports = {
    getStudentCurrentStandards,
    getStudentVideo,
    storeStudentVideo,
    getStudentStandard,
    UpdateStudentVideoCompleted,
    UpdateStudentVideoLastSeenTime,
    SaveOrRemoveVideo,
    getSavedVideos
};
