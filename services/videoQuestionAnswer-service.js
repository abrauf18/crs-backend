const { Sequelize } = require("sequelize");
const { logger } = require("../Logs/logger.js");
// @ts-ignore
const { Question, VideoQuestionAnswer } = require("../models/index.js");
const { RESOURCE_TYPES } = require("../utils/enumTypes.js");

const createVideoQuestionAnswer = async ({userId, questionId, answer, standardId}) => {
    try {
        const question = await Question.findByPk(questionId);
        if (!question) {
            return { code: 404 };
        }

        const existingAnswer = await VideoQuestionAnswer.findOne({
            where: {
                userId,
                questionId,
                standardId,
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
