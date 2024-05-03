const { Sequelize } = require("sequelize");
const { logger } = require("../Logs/logger.js");
const { Resource, Video, Question } = require("../models/index.js");
const { RESOURCE_TYPES } = require("../utils/enumTypes.js");

const getAllVideos = async () => {
    try {
        const videos = await Video.findAll({
            attributes: {
                include: [
                    [Sequelize.fn('COUNT', Sequelize.col('questions.id')), 'questionCount']
                ]
            },
            include: [{
                model: Resource,
                as: 'resource',
                attributes: ['name'],
            }, {
                model: Question,
                as: 'questions',
                attributes: [],
            }],
            group: ['Video.id', 'resource.id'],
        });

        const totalVideos = await Video.count();

        const videosWithResourceName = videos.map(video => {
            const { resource, questionCount, topics, ...videoData } = video.get({ plain: true });
            const topicsCount = Object.keys(topics).length;
            const questionCountNumber = Number(questionCount);
            return { ...videoData, name: resource.name, questionCountNumber, topicsCount };
        });

        if (videos) {
            return { code: 200, data: {videos: videosWithResourceName, totalVideos: totalVideos} };
        } else {
            return { code: 404 };
        }
    } catch (error) {
        logger.error(error?.message || 'An error occurred while getting the videos');
        return { code: 500 };
    }
};

const createVideo = async ({ resourceId, thumbnailURL, topics }) => {
    try {
        const resource = await Resource.findByPk(resourceId);
        if (!resource) {
            return { code: 404 };
        }
        const createdVideo = await Video.create({ resourceId, thumbnailURL, topics });
        return { code: 200, data: createdVideo };
    } catch (error) {
        logger.error(error?.message || 'An error occurred while creating the video');
        return { code: 500 };
    }
};

const createMinimalVideo = async ({ resourceId, thumbnailURL }) => {
    try {
        const resource = await Resource.findByPk(resourceId);
        if (!resource) {
            return { code: 404 };
        }
        const createdVideo = await Video.create({ resourceId, thumbnailURL });
        return { code: 200, data: createdVideo };
    } catch (error) {
        logger.error(error?.message || 'An error occurred while creating the video');
        return { code: 500 };
    }
};

const addTopicsInVideo = async ({ videoId, topics }) => {
    try {
        const video = await Video.findByPk(videoId);
        if (!video) {
            return { code: 404 };
        }
        await video.update({ topics })
        return { code: 200, data: video };
    } catch (error) {
        logger.error(error?.message || 'An error occurred while creating the video');
        return { code: 500 };
    }
};

const deleteVideo = async ({ videoId }) => {
    try {
        const video = await Video.findByPk(videoId);
        if (!video) {
            return { code: 404 };
        }
        const deletedVideo = await video.destroy();
        return { code: 200, data: deletedVideo };
    } catch (error) {
        console.log(error);
        logger.error(error?.message || 'An error occurred while deleting the video');
        return { code: 500 };
    }
};

const getVideo = async ({ videoId }) => {
    try {
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
            return { code: 404 };
        }

        const { resource, questions, topics, ...videoData } = video.get({ plain: true });

        return {
            code: 200,
            data: {
                video: { ...videoData, name: resource.name, videoUrl: resource.url, questions, topics }
            }
        };
    } catch (error) {
        logger.error(error?.message || 'An error occurred while getting the video details');
        return { code: 500 };
    }
};

const updateVideo = async ({ videoId, name, thumbnailURL, questions, topics }) => {
    try {
        const video = await Video.findByPk(videoId);
        if (!video) {
            return { code: 404 };
        }

        if (thumbnailURL) {
            await video.update( {thumbnailURL} );
        }

        const resource = await video.getResource();
        await resource.update({ name });

        if (questions) {
            const oldQuestions = await video.getQuestions();

            for (let question of oldQuestions) {
                await question.destroy();
            }

            const newQuestions = await Question.bulkCreate(questions.map(question => ({ ...question, videoId })));
            await video.setQuestions(newQuestions);
        }

        if (topics) {
            await video.update( {topics} );
        }

        return { code: 200, data: video };
    } catch (error) {
        logger.error(error?.message || 'An error occurred while updating the video');
        return { code: 500 };
    }
};

module.exports = {
    getAllVideos,
    createVideo,
    addTopicsInVideo,
    deleteVideo,
    getVideo,
    createMinimalVideo,
    updateVideo,
};
