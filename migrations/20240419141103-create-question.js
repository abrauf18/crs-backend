'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Questions', {
      id: {
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        type: Sequelize.UUID,
      },
      statement: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: ''
      },
      options: {
        allowNull: false,
        type: Sequelize.JSON,
        defaultValue: {}
      },
      totalMarks: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      popUpTime: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: '00:00:00'
      },
      correctOption: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: ''
      },
      correctOptionExplanation: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: ''
      },
      videoId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'Videos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
    await queryInterface.dropTable('Questions');
  }
};