const { Sequelize, where } = require("sequelize");
const { logger } = require("../Logs/logger.js");
const { User, AssessmentResourcesDetail, AssessmentAnswer, Resource } = require("../models/index.js");
const { RESOURCE_TYPES } = require("../utils/enumTypes.js");

const createAssessmentAnswer = async ({userId, assessmentResourcesDetailId, answerURL}) => {
    try {
        const existingUser = await User.findByPk(userId);
        if (!existingUser) {
            return { code: 404, message: "User not found" };
        }

        const existingAssessmentResourcesDetail = await AssessmentResourcesDetail.findByPk(assessmentResourcesDetailId);
        if (!existingAssessmentResourcesDetail) {
            return { code: 404, message: "AssessmentResourcesDetail not found" };
        }

        const createdAssessmentAnswer = await AssessmentAnswer.create({userId, assessmentResourcesDetailId, answerURL});
        return { code: 200, data: createdAssessmentAnswer };
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

const getAssessmentAnswerToCreateOrEdit = async ({ resourceId, userId }) => {
    try {
        const assessmentAnswer = await Resource.findOne({
            where: { id: resourceId },
            attributes: ['id', 'name', 'url'],
            include: [{
                model: AssessmentResourcesDetail,
                as: 'AssessmentResourcesDetail',
                attributes: ['id', 'totalMarks'],
                required: false,
                include: [{
                    model: AssessmentAnswer,
                    as: 'assessmentAnswers',
                    required: false,
                    attributes: ['id', 'answerURL', 'obtainedMarks'],
                    where: { userId },
                }]
            }]
        });

        const transformedAssesmentAnswer = {
            documentURL: assessmentAnswer?.url,
            answerURL: assessmentAnswer?.AssessmentResourcesDetail?.assessmentAnswers[0]?.answerURL || null,
            totalMarks: assessmentAnswer?.AssessmentResourcesDetail?.totalMarks,
            obtainedMarks: assessmentAnswer?.AssessmentResourcesDetail?.assessmentAnswers[0]?.obtainedMarks || null,
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
