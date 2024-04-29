const { Sequelize } = require("sequelize");
const { logger } = require("../Logs/logger.js");
const { Question } = require("../models/index.js");
const { RESOURCE_TYPES } = require("../utils/enumTypes.js");
const question = require("../models/question.js");

const createVideoQuestions = async ({ videoId, questions }) => {
    try {
        const createdQuestions = await Promise.all(questions.map(question => {
            const { statement, options, totalMarks, popUpTime } = question;
            return Question.create({ videoId, statement, options, totalMarks, popUpTime });
        }));

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