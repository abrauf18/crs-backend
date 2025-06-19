'use strict';
const { RESOURCE_TYPES, RESOURCE_STATUS } = require('../utils/enumTypes');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Resources', {
      id: {
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        type: Sequelize.UUID,
      },
      name: {
        allowNull: false,
        defaultValue: "",
        type: Sequelize.STRING
      },
      url: {
        allowNull: false,
        defaultValue: "",
        type: Sequelize.STRING
      },
      type: {
        allowNull: false,
        type: Sequelize.ENUM(
          RESOURCE_TYPES.SLIDESHOW, 
          RESOURCE_TYPES.VIDEO, 
          RESOURCE_TYPES.WORKSHEET, 
          RESOURCE_TYPES.QUIZ,
          RESOURCE_TYPES.ASSIGNMENT,
          RESOURCE_TYPES.LAB,
          RESOURCE_TYPES.STATION,
          RESOURCE_TYPES.ACTIVITY,
          RESOURCE_TYPES.GUIDED_NOTE,
          RESOURCE_TYPES.FORMATIVE_ASSESSMENT,
          RESOURCE_TYPES.SUMMARIZE_ASSESSMENT,
          RESOURCE_TYPES.DATA_TRACKER,
        ),
      },
      topic: {
        allowNull: false,
        defaultValue: "",
        type: Sequelize.STRING
      },
      status: {
        allowNull: false,
        defaultValue:"show",
        type: Sequelize.ENUM(
          RESOURCE_STATUS.SHOW,
          RESOURCE_STATUS.HIDE
        ),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Resources');
  }
};