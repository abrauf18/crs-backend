const { Sequelize, where } = require("sequelize");
const { logger } = require("../Logs/logger.js");
// @ts-ignore
const { User, Standard, AssessmentResourcesDetail, AssessmentAnswer, Resource, DailyUpload, ClassroomStudent, Classroom } = require("../models/index.js");
const { RESOURCE_TYPES, CLASSROOM_STATUS } = require("../utils/enumTypes.js");

function canSubmitAssessment(uploadDate, daysToAdd) {
    const uploadDateObj = new Date(uploadDate);
    uploadDateObj.setDate(uploadDateObj.getDate() + daysToAdd + 1);
    const today = new Date();
    if (today > uploadDateObj) {
        return false;
    }
    return true;
}

function getDeadline(uploadDate, daysToAdd) {
    const deadlineDate = new Date(uploadDate);
    deadlineDate.setDate(deadlineDate.getDate() + daysToAdd + 1);
    return deadlineDate
}

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

const createAssessmentAnswer = async ({userId, resourceId, standardId, answerURL}) => {
    try {
        const existingUser = await User.findByPk(userId);
        if (!existingUser) {
            return { code: 404, message: "User not found" };
        }

        const existingResource = await Resource.findByPk(resourceId);
        if (!existingResource) {
            return { code: 404, message: "Resource not found" };
        }

        const existingStandard = await Standard.findByPk(standardId);
        if (!existingStandard) {
            return { code: 404, message: "Resource not found" };
        }

        const existingAssessmentResourcesDetail = await AssessmentResourcesDetail.findOne({
            where: { resourceId }
        });
        if (!existingAssessmentResourcesDetail) {
            return { code: 404, message: "Assessment Resource not found" };
        }

        const studentClassroomId = await getClassroomIdOfStudent(userId);
        if (!studentClassroomId) {
            return { code: 404, message: 'Student is not enrolled in any active classroom' };
        }

        const dailyUpload = await DailyUpload.findOne({
            where: { resourceId, standardId }
        });
        if (!dailyUpload) {
            return { code: 404, message: "Daily Upload not found" };
        }

        if (canSubmitAssessment(dailyUpload.accessDate, existingAssessmentResourcesDetail.deadline) === false) {
            return { code: 400, message: "Deadline has passed" };
        }

        const existingAssessmentAnswer = await AssessmentAnswer.findOne({
            where: {
                userId,
                standardId,
                assessmentResourcesDetailId: existingAssessmentResourcesDetail.id,
                classroomId: studentClassroomId
            }
        });

        if (existingAssessmentAnswer) {
            existingAssessmentAnswer.answerURL = answerURL;

            await existingAssessmentAnswer.save();
            
            return { code: 200, data: existingAssessmentAnswer };
        } 
        else {
            const createdAssessmentAnswer = await AssessmentAnswer.create({
                userId,
                standardId,
                assessmentResourcesDetailId: existingAssessmentResourcesDetail.id,
                answerURL,
                classroomId: studentClassroomId
            });
            if (!createdAssessmentAnswer) {
                return { code: 500 };
            }

            return { code: 200, data: createdAssessmentAnswer };
        }
    } catch (error) {
        console.log('\n\n\n', error);
        logger.error(error?.message || 'An error occurred while getting the videos');
        return { code: 500 };
    }
};

const getAssessmentAnswer = async ({ assessmentAnswerId }) => {
    try {
        const assessmentAnswer = await AssessmentAnswer.findByPk(assessmentAnswerId);
        if (!assessmentAnswer) {
            return { code: 404 };
        }
        return { code: 200, data: assessmentAnswer };
    } catch (error) {
        console.log('\n\n\n', error);
        logger.error(error?.message || 'An error occurred while creating the video');
        return { code: 500 };
    }
};

const getAssessmentAnswerToCreateOrEdit = async ({ resourceId, userId, standardId }) => {
    try {
        const studentClassroomId = await getClassroomIdOfStudent(userId);
        if (!studentClassroomId) {
            return { code: 404, message: 'Student is not enrolled in any active classroom' };
        }

        const assessmentAnswer = await Resource.findOne({
            where: { id: resourceId },
            attributes: ['id', 'name', 'url'],
            include: [
                {
                    model: AssessmentResourcesDetail,
                    as: 'AssessmentResourcesDetail',
                    attributes: ['id', 'totalMarks', 'deadline'],
                    required: false,
                    include: [{
                        model: AssessmentAnswer,
                        as: 'assessmentAnswers',
                        required: false,
                        attributes: ['id', 'answerURL', 'obtainedMarks'],
                        where: { 
                            userId: userId, 
                            standardId: standardId,
                            classroomId: studentClassroomId 
                        },
                    }]
                },
                {
                    model: DailyUpload,
                    as: 'DailyUpload',
                    attributes: ['accessDate'],
                    where: { resourceId, standardId },
                    required: false,
                }
            ]
        });

        const transformedAssesmentAnswer = {
            name: assessmentAnswer?.name,
            documentURL: assessmentAnswer?.url,
            answerURL: assessmentAnswer?.AssessmentResourcesDetail?.assessmentAnswers[0]?.answerURL || null,
            totalMarks: assessmentAnswer?.AssessmentResourcesDetail?.totalMarks,
            obtainedMarks: assessmentAnswer?.AssessmentResourcesDetail?.assessmentAnswers[0]?.obtainedMarks || null,
            canWrite: canSubmitAssessment(assessmentAnswer?.DailyUpload?.accessDate, assessmentAnswer?.AssessmentResourcesDetail?.deadline),
            deadline: getDeadline(assessmentAnswer?.DailyUpload?.accessDate, assessmentAnswer?.AssessmentResourcesDetail?.deadline).toISOString().split('T')[0],
        }

        return { code: 200, data: transformedAssesmentAnswer };
    } catch (error) {
        console.log('\n\n\n', error);
        logger.error(error?.message || 'An error occurred while creating the video');
        return { code: 500 };
    }
};

module.exports = {
    createAssessmentAnswer,
    getAssessmentAnswer,
    getAssessmentAnswerToCreateOrEdit
};
