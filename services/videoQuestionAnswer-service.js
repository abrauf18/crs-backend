const { Sequelize } = require("sequelize");
const { logger } = require("../Logs/logger.js");
// @ts-ignore
const { Question, VideoQuestionAnswer, ClassroomStudent, Resource, DailyUpload, Standard, Enrollment, Video, Classroom } = require("../models/index.js");
const { CLASSROOM_STATUS } = require("../utils/enumTypes.js");
const classroom = require("../models/classroom.js");

async function getClassroomIdOfStudent (studentId) {
    const classroomStudent = await ClassroomStudent.findOne({
        where: {
            studentId: studentId,
        },
        include: {
            model: Classroom,
            as: 'classroom',
            where: {
                status: CLASSROOM_STATUS.ACTIVE
            }
        }
    });
    return classroomStudent?.classroom?.id;
}

const createVideoQuestionAnswer = async ({userId, questionId, answer, standardId}) => {
    try {
        const question = await Question.findByPk(questionId);
        if (!question) {
            return { code: 404, message: 'Question not found' };
        }

        const studentClassroomId = await getClassroomIdOfStudent(userId);
        if (!studentClassroomId) {
            return { code: 404, message: 'Student is not enrolled in any active classroom' };
        }

        const existingAnswer = await VideoQuestionAnswer.findOne({
            where: {
                userId,
                questionId,
                standardId,
                classroomId: studentClassroomId,
            },
        });
        if (existingAnswer) {
            return { code: 409 };
        }

        let videoQuestionAnswer = {};

        if ( !question.correctOption ) {
            videoQuestionAnswer = await VideoQuestionAnswer.create({
                userId,
                questionId,
                answer,
                standardId,
                classroomId: studentClassroomId,
            });
        } 
        else {
            const correctAnswer = question.correctOption;
            const obtainedMarks = correctAnswer === answer ? question.totalMarks : 0;
            videoQuestionAnswer = await VideoQuestionAnswer.create({
                userId,
                questionId,
                answer,
                obtainedMarks,
                standardId,
                classroomId: studentClassroomId,
            });

            const video = await Video.findOne({
                where: {
                    id: question.videoId,
                },
                attributes: ['id', 'totalMarks'],
                include: {
                    model: Resource,
                    as: 'resource',
                    attributes: ['id'],
                    include: {
                        model: DailyUpload,
                        as: 'DailyUpload',
                        attributes: ['id', 'weightage'],
                        include: {
                            model: Standard,
                            as: 'standard',
                            attributes: ['id'],
                            where: {
                                id: standardId,
                            }
                        },
                    },
                },
            }); 

            // Retrieve weightage from data
            let weightage = 0;
            if (video && video.resource && video.resource.DailyUpload && video.resource.DailyUpload.standard) {
                weightage = video.resource.DailyUpload.weightage;
            }

            await Enrollment.increment('result', {
                by: obtainedMarks/video.totalMarks * weightage,
                where: {
                    studentId: userId,
                    standardId: standardId,
                    classroomId: studentClassroomId, 
                }
            });
        }

        return { code: 200, data: videoQuestionAnswer };
    } catch (error) {
        console.log('\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting the videos');
        return { code: 500 };
    }
};

module.exports = {
    createVideoQuestionAnswer,
};
