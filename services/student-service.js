const { Sequelize, Op } = require("sequelize");
const { logger } = require("../Logs/logger.js");
// @ts-ignore
const { Classroom, Standard, ClassroomCourses, ClassroomStudent, User, DailyUpload, Resource, Video, VideoTracking, Question, VideoQuestionAnswer, AssessmentResourcesDetail, AssessmentAnswer } = require("../models/index.js");
const { CLASSROOM_STATUS } = require("../utils/enumTypes.js");
const ROLES = require("../models/roles/index.js");

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

async function checkStudentAndStandard({role, studentId, standardId}) {
    const student = await User.findByPk(studentId);
    if (!student) {
        return { code: 404, message: 'Student not found'};
    }

    const standard = await Standard.findByPk(standardId);
    if (!standard) {
        return { code: 404, message: 'Standard not found'};
    }
    
    const studentData = await ClassroomStudent.findOne({
        where: {
            studentId: studentId,
        },
        include: [{
            model: Classroom,
            as: 'classroom',
            where: { status: CLASSROOM_STATUS.ACTIVE },
            required: false,
            include: [{
                model: ClassroomCourses,
                as: 'classroomCourses',
                where: { standardId: standardId },
                required: false
            }]
        }]
    })

    if (!studentData) {
        return { code: 404, message: 'Student is not enrolled in any classroom' }
    }

    if (!studentData.classroom) {
        return { code: 404, message: 'Classroom not active any more' }
    }

    if (!studentData.classroom.classroomCourses || studentData.classroom.classroomCourses.length === 0) {
        return { code: 404, message: 'Classroom of student does not have this standard' }
    }

    return { code: 200, message: 'relation between student and standard found' }
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

const getStudentVideo = async ({ role, videoId, studentId, standardId }) => {
    try {
        const checkActiveStandardResult = await checkStudentAndStandard({role, studentId, standardId});
        if (checkActiveStandardResult.code !== 200){
            return checkActiveStandardResult
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

const storeStudentVideo = async ({ role, videoId, studentId, last_seen_time, standardId }) => {
    try {
        const video = await Video.findByPk(videoId);
        if (!video) {
            return { code: 404, message: 'Video not found'};
        }

        if (compareTimes(last_seen_time, video.duration) > 0) {
            return { code: 400 };
        }

        const checkActiveStandardResult = await checkStudentAndStandard({role, studentId, standardId});
        if (checkActiveStandardResult.code !== 200){
            return checkActiveStandardResult
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

const getStudentStandard = async ({ role, standardId, studentId }) => {
    try {
        const checkActiveStandardResult = await checkStudentAndStandard({role, studentId, standardId});
        if (checkActiveStandardResult.code !== 200){
            return checkActiveStandardResult
        }

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

const UpdateStudentVideoCompleted = async ({ role, videoId, studentId, standardId, watchedCompletely, last_seen_time }) => {
    try {
        const video = await Video.findByPk(videoId);
        if (!video) {
            return { code: 404, message: 'Video not found'};
        }

        const checkActiveStandardResult = await checkStudentAndStandard({role, studentId, standardId});
        if (checkActiveStandardResult.code !== 200){
            return checkActiveStandardResult
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

const UpdateStudentVideoLastSeenTime = async ({ role, videoId, studentId, standardId, last_seen_time }) => {
    try {
        const video = await Video.findByPk(videoId);
        if (!video) {
            return { code: 404, message: 'Video not found'};
        }

        const checkActiveStandardResult = await checkStudentAndStandard({role, studentId, standardId});
        if (checkActiveStandardResult.code !== 200){
            return checkActiveStandardResult
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

const SaveOrRemoveVideo = async ({ role, videoId, studentId, standardId, save }) => {
    try {
        const video = await Video.findByPk(videoId);
        if (!video) {
            return { code: 404, message: 'Video not found'};
        }

        const checkActiveStandardResult = await checkStudentAndStandard({role, studentId, standardId});
        if (checkActiveStandardResult.code !== 200){
            return checkActiveStandardResult
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

const getStudentProfileStandardResults = async ({ role, studentId, standardId }) => {
    try {
        const checkActiveStandardResult = await checkStudentAndStandard({role, studentId, standardId});
        if (checkActiveStandardResult.code !== 200){
            return checkActiveStandardResult
        }

       const standard = await Standard.findByPk(standardId, {
            attributes: ['id', 'name', 'description', 'courseLength'],
            include: [{
                model: DailyUpload,
                as: 'dailyUploads',
                attributes: ['id', 'accessDate', 'weightage'],
                where: {
                    // accessDate: {
                    //     [Op.lte]: new Date()
                    // }
                    weightage: {
                        [Op.gt]: 0
                    },
                },
                include: [{
                    model: Resource,
                    as: 'resource',
                    attributes: ['id', 'name', 'type'],
                    include: [
                        {
                            model: Video,
                            as: 'video',
                            attributes: ['id'],
                            include: [{
                                model: Question,
                                as: 'questions',
                                attributes: ['id', 'statement', 'totalMarks', 'options', 'correctOption', 'correctOptionExplanation'],
                                required: false,
                                include: [{
                                    model: VideoQuestionAnswer,
                                    as: 'answers',
                                    where: { userId: studentId },
                                    attributes: ['obtainedMarks', 'answer'],
                                    required: false
                                }]
                            }]
                        },
                        {
                            model: AssessmentResourcesDetail,
                            as: 'AssessmentResourcesDetail',
                            attributes: ['id', 'totalMarks', 'deadline'],
                            include: [{
                                model: AssessmentAnswer,
                                as: 'assessmentAnswers',
                                where: { userId: studentId },
                                attributes: ['obtainedMarks', 'answerURL'],
                                required: false,
                                separate: true
                            }]
                        }
                    ]
                }],
            }],
            order: [
                [{ model: DailyUpload, as: 'dailyUploads' }, 'accessDate', 'ASC']
            ],
        });

        // Current date for comparison
        const today = new Date();

        const result = await standard?.get({plain: true});

        if (!result) {
            return {
                code: 200,
                data: []
            };
        }

        let currentTotalWeightage = 0;
        let currentAcheivedWeightage = 0;
        let totalUnMarkedWeightage = 0;
        let totalunAnsweredWeightage = 0;

        // Add accessible field and calculate performance
        result.dailyUploads = result?.dailyUploads?.map(dailyUpload => {
            const accessDate = new Date(dailyUpload.accessDate);
            dailyUpload.accessible = accessDate < today;

            let totalObtainedMarks = 0;
            let totalPossibleMarks = 0;
            let yetToMarkWeightage = 0;
            let unAnsweredWeightage = 0;

            
            // Calculate total obtained marks and total possible marks for the video
            if (dailyUpload.resource.video) {
                let unmarkedQuestionsTotal = 0;
                totalPossibleMarks = dailyUpload.resource.video?.questions?.reduce((total, question) => {
                    return total + question.totalMarks;
                }, 0);
                dailyUpload.resource.video?.questions?.forEach(question => {
                    if (!question?.answers || question.answers.length === 0) {
                        unAnsweredWeightage += (question.totalMarks / totalPossibleMarks) * dailyUpload.weightage;
                    }
                    question?.answers?.forEach(answer => {
                        totalObtainedMarks += answer?.obtainedMarks === -1 ? 0 : answer?.obtainedMarks;
                        unmarkedQuestionsTotal += (answer?.obtainedMarks === -1 ? question.totalMarks : 0);
                        yetToMarkWeightage += (unmarkedQuestionsTotal / totalPossibleMarks) * dailyUpload.weightage;
                    });
                });
            }

            // Calculate total obtained marks and total possible marks for the assessment
            if (dailyUpload.resource.AssessmentResourcesDetail) {
                if (!dailyUpload.resource.AssessmentResourcesDetail?.assessmentAnswers || dailyUpload.resource.AssessmentResourcesDetail.assessmentAnswers.length === 0) {
                    unAnsweredWeightage += dailyUpload.weightage;
                }
                dailyUpload.resource.AssessmentResourcesDetail?.assessmentAnswers?.forEach(answer => {
                    totalObtainedMarks += answer?.obtainedMarks === -1 ? 0 : answer?.obtainedMarks;
                    yetToMarkWeightage += (answer?.obtainedMarks === -1 ? dailyUpload.weightage : 0);

                });
                totalPossibleMarks += dailyUpload.resource.AssessmentResourcesDetail?.totalMarks || 0;
            }

            // Calculate performance
            dailyUpload.performance = totalPossibleMarks > 0 ? (totalObtainedMarks / totalPossibleMarks) * (dailyUpload.weightage / 100) : dailyUpload.weightage;
            dailyUpload.yetToMarkWeightage = parseFloat(yetToMarkWeightage.toFixed(1));
            dailyUpload.unAnsweredWeightage = parseFloat(unAnsweredWeightage.toFixed(1));
            totalUnMarkedWeightage += parseFloat(yetToMarkWeightage.toFixed(1));
            totalunAnsweredWeightage += parseFloat(unAnsweredWeightage.toFixed(1));

            if (dailyUpload.accessible) {
                currentTotalWeightage += dailyUpload.weightage;
                currentAcheivedWeightage += dailyUpload.performance;
            }

            return dailyUpload;
        });

        result.currentTotalWeightage = parseFloat(currentTotalWeightage.toFixed(1));
        result.currentAcheivedWeightage = parseFloat(currentAcheivedWeightage.toFixed(1));
        result.totalUnMarkedWeightage = parseFloat(totalUnMarkedWeightage.toFixed(1));
        result.totalunAnsweredWeightage = parseFloat(totalunAnsweredWeightage.toFixed(1));

        return {
            code: 200,
            data: result
        };
    } catch (error) {
        console.log('\n\n\n\n', error);
        logger.error(error?.message || 'An error occurred while fetching the standard');
        return { code: 500 };
    }
};

const getStudentProfileSummarizedStandards = async ({ studentId }) => {
    try {
        const student = await User.findByPk(studentId);
        if (!student) {
            return { code: 404, message: 'Student not found'};
        }

        // const data = await User.sequelize.query(`
        //     SELECT  
        //         *
        //     FROM 
        //         "ClassroomStudents" AS CS
        //     INNER JOIN 
        //         "Classrooms" AS C ON C."id" = CS."classroomId"
        //     INNER JOIN 
        //         "ClassroomCourses" AS CC ON CC."classroomId" = C."id"
        //     INNER JOIN 
        //         "Standards" AS S ON S."id" = CC."standardId"
        //     INNER JOIN 
        //         "DailyUploads" AS DU ON DU."standardId" = S."id"
        //     LEFT JOIN 
        //         "Resources" AS R ON R."id" = DU."resourceId"
        //     LEFT JOIN 
        //         "AssessmentResourcesDetails" AS ARD ON R."id" = ARD."resourceId"
        //     LEFT JOIN 
        //         "AssessmentAnswers" AS AA ON AA."assessmentResourcesDetailId" = ARD."id"
        //     LEFT JOIN 
        //         "Videos" AS V ON R."id" = V."resourceId"
        //     LEFT JOIN 
        //         "VideoTrackings" AS VT ON VT."videoId" = V."id"
        //     LEFT JOIN 
        //         "Questions" AS Q ON Q."videoId" = V."id"
        //     LEFT JOIN 
        //         "VideoQuestionAnswers" AS VQA ON VQA."questionId" = Q."id"
        //     WHERE 
        //         CS."studentId" = '${studentId}' AND C."status" = 'active'
        // `);
        
        // const rows = data[0];

        const currentStandardsWithResources = await ClassroomStudent.findOne({
            where: {
                studentId: studentId
            },
            attributes: [ "id" ],
            include: [ 
                {
                    model: Classroom,
                    as: 'classroom',
                    where: { status: CLASSROOM_STATUS.ACTIVE },
                    attributes: [ "id" ],
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

        return { code: 200, data: currentStandardsWithResources };
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
    getSavedVideos,
    getStandardsResourcesAndCount,
    getStudentProfileStandardResults,
    getStudentProfileSummarizedStandards
};
