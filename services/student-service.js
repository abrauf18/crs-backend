const { Sequelize, Op } = require("sequelize");
const { logger } = require("../Logs/logger.js");
// @ts-ignore
const { Classroom, Standard, ClassroomCourses, ClassroomStudent, User, DailyUpload, Resource, Video, VideoTracking, Question, VideoQuestionAnswer, AssessmentResourcesDetail } = require("../models/index.js");
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

function canSubmitAssessment(uploadDate, daysToAdd) {
    const uploadDateObj = new Date(uploadDate);
    uploadDateObj.setDate(uploadDateObj.getDate() + daysToAdd + 1);
    const today = new Date();
    if (today > uploadDateObj) {
        return false;
    }
    return true;
}

async function checkStandardActive({studentId, standardId}) {
    const studentData = await ClassroomStudent.findOne({
        where: {
            studentId: studentId,
        },
        include: [{
            model: Classroom,
            as: 'classroom',
            where: { status: CLASSROOM_STATUS.ACTIVE },
            include: [{
                model: ClassroomCourses,
                as: 'classroomCourses',
                where: { standardId: standardId },
                required: true
            }]
        }]
    })

    if (!studentData) {
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

const getStudentVideo = async ({ videoId, studentId, standardId }) => {
    try {
        const student = await User.findByPk(studentId);
        if (!student) {
            return { code: 404, message: 'Student not found'};
        }

        if (!checkStandardActive({studentId, standardId})){
            return { code: 404, message: 'Standard not active any more' };
        }

        const watchedVideo = await VideoTracking.findOne({
            where: {
                videoId: videoId,
                studentId: studentId,
                standardId: standardId
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

const storeStudentVideo = async ({ videoId, studentId, last_seen_time, standardId }) => {
    try {
        const video = await Video.findByPk(videoId);
        if (!video) {
            return { code: 404, message: 'Video not found'};
        }

        const student = await User.findByPk(studentId);
        if (!student) {
            return { code: 404, message: 'Student not found'};
        }

        const standard = await Standard.findByPk(standardId);
        if (!standard) {
            return { code: 404, message: 'Standard not found'};
        }

        if (compareTimes(last_seen_time, video.duration) > 0) {
            return { code: 400 };
        }

        if (!checkStandardActive({studentId, standardId})){
            return { code: 404, message: 'Standard not active any more' };
        }

        const existingVideoTracking = await VideoTracking.findOne({
            where: {
                videoId: videoId,
                studentId: studentId,
                standardId: standardId
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
            standardId: standardId
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
                                where: { 
                                    studentId: studentId,
                                    standardId: standardId
                                }
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

        if (!checkStandardActive({studentId, standardId})){
            return { code: 404, message: 'Standard not active any more' };
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

const UpdateStudentVideoCompleted = async ({ videoId, studentId, standardId, watchedCompletely, last_seen_time }) => {
    try {
        const video = await Video.findByPk(videoId);
        if (!video) {
            return { code: 404, message: 'Video not found'};
        }

        const student = await User.findByPk(studentId);
        if (!student) {
            return { code: 404, message: 'Student not found'};
        }

        const standard = await Standard.findByPk(standardId);
        if (!standard) {
            return { code: 404, message: 'Standard not found'};
        }

        if (!checkStandardActive({studentId, standardId})){
            return { code: 404, message: 'Standard not active any more' };
        }

        const videoTracking = await VideoTracking.findOne({
            where: {
                videoId: videoId,
                studentId: studentId,
                standardId: standardId
            }
        });

        if (compareTimes(last_seen_time, video.duration) > 0) {
            return { code: 400 };
        }

        if (!videoTracking) {
            const newVideotracking = await VideoTracking.create({
                videoId: videoId,
                studentId: studentId,
                standardId: standardId,
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

const UpdateStudentVideoLastSeenTime = async ({ videoId, studentId, standardId, last_seen_time }) => {
    try {
        const video = await Video.findByPk(videoId);
        if (!video) {
            return { code: 404, message: 'Video not found'};
        }

        const student = await User.findByPk(studentId);
        if (!student) {
            return { code: 404, message: 'Student not found'};
        }

        const standard = await Standard.findByPk(standardId);
        if (!standard) {
            return { code: 404, message: 'Standard not found'};
        }

        if (!checkStandardActive({studentId, standardId})){
            return { code: 404, message: 'Standard not active any more' };
        }

        const videoTracking = await VideoTracking.findOne({
            where: {
                videoId: videoId,
                studentId: studentId,
                standardId: standardId
            }
        });

        if (compareTimes(last_seen_time, video.duration) > 0) {
            return { code: 400 };
        }

        if (!videoTracking) {
            const newVideotracking = await VideoTracking.create({
                videoId: videoId,
                studentId: studentId,
                standardId: standardId,
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

const SaveOrRemoveVideo = async ({ videoId, studentId, standardId, save }) => {
    try {
        const video = await Video.findByPk(videoId);
        if (!video) {
            return { code: 404, message: 'Video not found'};
        }

        const student = await User.findByPk(studentId);
        if (!student) {
            return { code: 404, message: 'Student not found'};
        }

        const standard = await Standard.findByPk(standardId);
        if (!standard) {
            return { code: 404, message: 'Standard not found'};
        }

        if (!checkStandardActive({studentId, standardId})){
            return { code: 404, message: 'Standard not active any more' };
        }

        const existingVideoTracking = await VideoTracking.findOne({
            where: {
                videoId: videoId,
                studentId: studentId,
                standardId: standardId
            }
        });

        if (existingVideoTracking) {
            if (save === true && existingVideoTracking.saved === true) {
                return { code: 409, message: 'Video is already saved' };
            }
            await existingVideoTracking.update({
                saved: save
            });

            return { code: 200, data: existingVideoTracking };
        }

        const videotracking = await VideoTracking.create({
            videoId: videoId,
            studentId: studentId,
            standardId: standardId,
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

        // const videoTrackingData = await VideoTracking.findAll({
        //     where: {
        //         studentId: studentId,
        //         saved: true
        //     },
        //     attributes: ['videoId', 'standardId', 'last_seen_time', 'watchedCompletely']
        // });

        // // Fetch the video data
        // const videos = await Video.findAll({
        //     where: {
        //         id: videoTrackingData.map(data => data.videoId)
        //     },
        //     attributes: ['id', 'thumbnailURL', 'duration', 'topics'],
        //     include: [
        //         {
        //             model: Resource,
        //             as: 'resource',
        //             attributes: ['id', 'name'],
        //             include: [{
        //                 model: DailyUpload,
        //                 as: 'DailyUpload',
        //                 where: {
        //                     standardId: videoTrackingData.map(data => data.standardId)
        //                 },
        //                 attributes: ['accessDate', 'standardId'],
        //                 required: true
        //             }]
        //         },
        //         {
        //             model: Question,
        //             as: 'questions',
        //             attributes: ['id'],
        //         }
        //     ]
        // });

        // // Map the video tracking data to the videos
        // const savedVideos = videoTrackingData.map(trackingData => {
        //     const video = videos.find(video => video.id === trackingData.videoId);
        //     return {
        //         ...trackingData.get({ plain: true }),
        //         video: video.get({ plain: true })
        //     };
        // });

        // const transformedVideos = savedVideos.map(savedVideo => {
        //     const { videoId, last_seen_time, watchedCompletely, video } = savedVideo;
        //     const { resource, ...videoData } = video
        //     return {
        //         videoId: videoId,
        //         name: resource.name,
        //         lastSeenTime: last_seen_time,
        //         thumbnailURL: videoData.thumbnailURL,
        //         duration: videoData.duration,
        //         topicCount: Object.keys(videoData.topics).length,
        //         questionCount: videoData.questions.length,
        //         accessDate: resource.DailyUpload.accessDate,
        //         completed: watchedCompletely,
        //         standardId: resource.DailyUpload.standardId
        //     };
        // });

        // const groupedVideos = transformedVideos.reduce((grouped, video) => {
        //     const date = video.accessDate;
        //     const index = grouped.findIndex(group => group.date === date);
        //     if (index === -1) {
        //         grouped.push({ date, videos: [video] });
        //     } else {
        //         grouped[index].videos.push(video);
        //     }
        //     return grouped;
        // }, []);
        
        // const sortedGroupedVideos = groupedVideos.sort((a, b) => a.date < b.date ? -1 : (a.date > b.date ? 1 : 0));

        const data = await Video.sequelize.query(`SELECT  
                                                V."id" AS "videoId",
                                                R."name" AS "name",
                                                VT."last_seen_time" AS "lastSeenTime",
                                                V."thumbnailURL" AS "thumbnailURL",
                                                V."duration" AS "duration",
                                                V."topics" AS "topics",
                                                COUNT(Q."id") AS "questionCount",
                                                DU."accessDate" AS "accessDate",
                                                VT."watchedCompletely" AS "completed",
                                                DU."standardId" AS "standardId"
                                            FROM 
                                                "VideoTrackings" AS VT
                                            INNER JOIN 
                                                "Videos" AS V ON VT."videoId" = V."id"
                                            INNER JOIN 
                                                "Resources" AS R ON V."resourceId" = R."id"
                                            INNER JOIN 
                                                "DailyUploads" AS DU ON DU."resourceId" = V."resourceId" AND DU."standardId" = VT."standardId"
                                            LEFT JOIN 
                                                "Questions" AS Q ON Q."videoId" = V."id"
                                            INNER JOIN 
                                                "ClassroomStudents" AS CS ON CS."studentId" = '${studentId}'
                                            INNER JOIN 
                                                "Classrooms" AS C ON C."id" = CS."classroomId"
                                            INNER JOIN 
                                                "ClassroomCourses" AS CC ON CC."classroomId" = C."id" AND CC."standardId" = DU."standardId"
                                            WHERE 
                                                VT."saved" = true AND '${studentId}' = VT."studentId" AND C."status" = 'active'
                                            GROUP BY 
                                                V."id", R."name", VT."last_seen_time", V."thumbnailURL", V."duration", DU."accessDate", VT."watchedCompletely", DU."standardId";`
                                        );

        const transformedData = data[0].map(item => {
            const {topics, ...other} = item;
            const topicCount = Object.keys(topics).length;
            return { ...other, topicCount };
        });

        const groupedVideos = transformedData.reduce((grouped, video) => {
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

// const getStandardsResourcesAndCount = async ({ studentId }) => {
//     try {
//         const student = await User.findByPk(studentId);
//         if (!student) {
//             return { code: 404, message: 'Student not found'};
//         }

//         const currentStandardsWithResources = await ClassroomStudent.findOne({
//             where: {
//                 studentId: studentId
//             },
//             attributes: [ "id" ],
//             include: [ 
//                 {
//                     model: Classroom,
//                     as: 'classroom',
//                     where: { status: CLASSROOM_STATUS.ACTIVE },
//                     attributes: [ "id" ],
//                     include: [{
//                         model: ClassroomCourses,
//                         as: 'classroomCourses',
//                         attributes: [ "id" ],
//                         include: [{
//                             model: Standard,
//                             as: 'standard',
//                             attributes: [ "id", "name" ],
//                             include: [{ 
//                                 model: DailyUpload, 
//                                 as: 'dailyUploads',
//                                 attributes: ['id', 'accessDate'],
//                                 include: [{
//                                     model: Resource,
//                                     as: 'resource',
//                                     where: { 'type': {[Op.ne]: 'video'}},
//                                     attributes: ['id', 'name', 'type', 'topic', 'url'],
//                                 }]
//                             }]
//                         }],
//                     }],
//                 }
//             ],
//         });

//         const transformedData = {
//             id: currentStandardsWithResources.id,
//             standards: currentStandardsWithResources.classroom.classroomCourses.map(course => ({
//                 id: course.standard.id,
//                 name: course.standard.name,
//                 resourceCount: course.standard.dailyUploads.length,
//                 resources: course.standard.dailyUploads.map(upload => ({
//                     id: upload.resource.id,
//                     name: upload.resource.name,
//                     type: upload.resource.type,
//                     topic: upload.resource.topic,
//                     url: upload.resource.url
//                 }))
//             }))
//         };

//         return { code: 200, data: transformedData };
//     } catch (error) {
//         console.log('\n\n\n\n', error)
//         logger.error(error?.message || 'An error occurred while fetching the standard');
//         return { code: 500 };
//     }
// };

const getStandardsResourcesAndCount = async ({ studentId, page, limit, orderBy, sortBy }) => {
    try {
        const student = await User.findByPk(studentId);
        if (!student) {
            return { code: 404, message: 'Student not found' };
        }

        const offset = (page - 1) * limit;

        const activeClassroom = await ClassroomStudent.findOne({
            where: {
                studentId: studentId
            },
            include: [{
                model: Classroom,
                as: 'classroom',
                where: { status: CLASSROOM_STATUS.ACTIVE },
                attributes: ['id'],
                include: [{
                    model: ClassroomCourses,
                    as: 'classroomCourses',
                    attributes: ['standardId'],
                }],
            }],
        });

        if (!activeClassroom) {
            return { code: 404, message: 'Active classroom not found' };
        }

        const standardIds = activeClassroom.classroom.classroomCourses.map(course => course.standardId);

        const standards = await Standard.findAll({
            where: { id: standardIds },
            attributes: ['id', 'name'],
            order: [[orderBy, sortBy]],
            offset,
            limit,
            include: [{
                model: DailyUpload,
                as: 'dailyUploads',
                attributes: ['id', 'resourceId', 'accessDate'],
                include: [{
                    model: Resource,
                    as: 'resource',
                    attributes: ['id', 'name', 'type', 'topic', 'url'],
                    where: { 
                        type: { [Op.ne]: 'video' } 
                    },
                }],
            }],
        });

        const totalStandardsCount = await Standard.count({
            where: { id: standardIds },
        });

        const transformedData = standards.map(standard => ({
            id: standard.id,
            name: standard.name,
            resourceCount: standard.dailyUploads.length,
            resources: standard.dailyUploads.map(upload => ({
                id: upload.resource.id,
                name: upload.resource.name,
                type: upload.resource.type,
                topic: upload.resource.topic,
                url: upload.resource.url,
                released: upload.accessDate <= new Date().toISOString(),
            }))
        }));

        return {
            code: 200,
            data: {
                totalPages: Math.ceil(totalStandardsCount / limit),
                standards: transformedData
            }
        };
    } catch (error) {
        console.log(error);
        logger.error(error?.message || 'An error occurred while fetching the standard');
        return { code: 500 };
    }
};

const getStudentProfileVideoResults = async ({ studentId, standardId }) => {
    try {
        const student = await User.findByPk(studentId);
        if (!student) {
            return { code: 404, message: 'Student not found' };
        }

       const standard = await Standard.findByPk(standardId, {
            include: [{
                model: DailyUpload,
                as: 'dailyUploads',
                attributes: ['id', 'accessDate'],
                where: {
                    accessDate: {
                        [Op.lte]: new Date()
                    }
                },
                include: [{
                    model: Resource,
                    as: 'resource',
                    attributes: ['id', 'name', 'type'],
                    where: { type: 'video' },
                    include: [{
                        model: Video,
                        as: 'video',
                        attributes: ['id'],
                        required: true,
                        include: [{
                            model: Question,
                            as: 'questions',
                            attributes: ['id', 'totalMarks'],
                            required: true,
                            include: [{
                                model: VideoQuestionAnswer,
                                as: 'answers',
                                where: { userId: studentId },
                                required: false
                            }]
                        }]
                    }]
                }]
            }]
        });
        
        if (!checkStandardActive({studentId, standardId})){
            return { code: 404, message: 'Standard not active any more' };
        }

        return {
            code: 200,
            data: standard
        };
    } catch (error) {
        console.log(error);
        logger.error(error?.message || 'An error occurred while fetching the standard');
        return { code: 500 };
    }
};

module.exports = {
    getStudentCurrentStandards,
    getStudentVideo,
    storeStudentVideo,
    getStudentStandard,
    UpdateStudentVideoCompleted,
    UpdateStudentVideoLastSeenTime,
    SaveOrRemoveVideo,
    getSavedVideos,
    getStandardsResourcesAndCount,
    getStudentProfileVideoResults
};
