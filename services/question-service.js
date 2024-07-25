const { Sequelize } = require("sequelize");
const { logger } = require("../Logs/logger.js");
// @ts-ignore
const { Question, Video } = require("../models/index.js");

const createVideoQuestions = async ({ videoId, questions }) => {
    try {
        const existingVideo = await Video.findOne({ where: { id: videoId } });
        if (!existingVideo) {
            return { code: 404, message: 'Video not found' };
        }

        let sumAllQuestionMarks = 0;

        const createdQuestions = await Promise.all(questions.map(question => {
            const { statement, options, correctOption, correctOptionExplanation, totalMarks, popUpTime } = question;
            sumAllQuestionMarks = sumAllQuestionMarks + totalMarks;
            return Question.create({ videoId, statement, options, correctOption, correctOptionExplanation, totalMarks, popUpTime });
        }));

        await existingVideo.update({ totalMarks: sumAllQuestionMarks });

        return { code: 200, data: createdQuestions };
    } catch (error) {
        logger.error(error?.message || 'An error occurred while creating the video');
        return { code: 500 };
    }
};

const getVideoQuestions = async ({ videoId }) => {
    try {
        const questions = await Question.findAll({ where: { videoId: videoId } });

        return { code: 200, data: questions };
    } catch (error) {
        console.log(error);
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};
// Export the createVideoQuestions function
module.exports = {
    createVideoQuestions,
    getVideoQuestions
};